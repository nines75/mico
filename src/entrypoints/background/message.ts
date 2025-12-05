import { colors, messages } from "@/utils/config.js";
import { loadSettings } from "@/utils/storage.js";
import {
    changeBadgeState,
    createLogId,
    escapeNewline,
    getLogId,
    sendNotification,
    tryMountLogId,
    tryWithPermission,
} from "@/utils/util.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import { filterVideo } from "./video-filter/filter-video.js";
import { saveLog } from "./video-filter/save-log.js";
import { Settings } from "@/types/storage/settings.types.js";
import {
    setSettings,
    removeAllData,
    addNgUserId,
    removeNgUserId,
    addNgId,
    removeNgId,
} from "@/utils/storage-write.js";
import { sendMessageToContent } from "../content/message.js";
import { cleanupDb, getLogData, setTabData } from "@/utils/db.js";
import { TabData } from "@/types/storage/tab.types.js";
import { RenderedComment } from "@/types/api/comment.types.js";
import { LogData } from "@/types/storage/log.types.js";
import { DropdownComment } from "../content/dropdown.js";

type ExtractData<
    T extends Extract<BackgroundMessage, { data: unknown }>["type"],
> = Extract<BackgroundMessage, { type: T }>["data"];

type BackgroundMessage =
    | {
          type: "get-user-id-for-mount";
          data: DropdownComment;
      }
    | {
          type: "add-ng-user-id-from-dropdown";
          data: DropdownComment & { specific: boolean };
      }
    | {
          type: "get-comments-from-dropdown";
          data: DropdownComment;
      }
    | {
          type: "filter-old-search";
          data: NiconicoVideo[];
      }
    | {
          type: "set-settings";
          data: Partial<Settings>;
      }
    | {
          type: "set-tab-data";
          data: Partial<TabData>;
      }
    | {
          type: "remove-all-data";
      }
    | {
          type: "add-ng-user-id";
          data: Set<string>;
      }
    | {
          type: "remove-ng-user-id";
          data: {
              userIds: Set<string>;
              isRemoveSpecific?: boolean;
          };
      }
    | {
          type: "add-ng-id";
          data: string;
      }
    | {
          type: "remove-ng-id";
          data: string;
      }
    | {
          type: "disable-ime";
      }
    | {
          type: "restore-badge";
      }
    | {
          type: "get-log-data";
          data: string;
      }
    | {
          type: "send-notification";
          data: string;
      };

export async function sendMessageToBackground(
    message: BackgroundMessage,
): Promise<unknown> {
    return await browser.runtime.sendMessage(message);
}

export async function backgroundMessageHandler(
    message: BackgroundMessage,
    sender: browser.runtime.MessageSender,
) {
    // エラーの発生箇所を出力するためにメッセージ受信側でエラーを出力
    try {
        if (sender.id !== browser.runtime.id) return;

        switch (message.type) {
            case "get-user-id-for-mount": {
                await getUserIdForMount(message.data, sender);
                break;
            }
            case "add-ng-user-id-from-dropdown": {
                await addNgUserIdFromDropdown(message.data, sender);
                break;
            }
            case "get-comments-from-dropdown": {
                return await getCommentsFromDropdown(message.data, sender);
            }
            case "filter-old-search": {
                await filterOldSearch(message.data, sender);
                break;
            }
            case "set-settings": {
                await setSettings(message.data);
                break;
            }
            case "set-tab-data": {
                const tabId = sender.tab?.id;
                if (tabId !== undefined) {
                    await setTabData(message.data, tabId);
                }

                break;
            }
            case "remove-all-data": {
                await removeAllData();
                break;
            }
            case "add-ng-user-id": {
                await addNgUserId(message.data);
                break;
            }
            case "remove-ng-user-id": {
                await removeNgUserId(
                    message.data.userIds,
                    message.data.isRemoveSpecific,
                );
                break;
            }
            case "add-ng-id": {
                await addNgId(message.data);
                break;
            }
            case "remove-ng-id": {
                await removeNgId(message.data);
                break;
            }
            case "disable-ime": {
                await disableIme();
                break;
            }
            case "restore-badge": {
                await restoreBadge(sender);
                break;
            }
            case "get-log-data": {
                return await getLogData(message.data);
            }
            case "send-notification": {
                await sendNotification(message.data);
                break;
            }
        }
    } catch (e) {
        console.error(e);
    }
}

async function getUserIdForMount(
    data: ExtractData<"get-user-id-for-mount">,
    sender: browser.runtime.MessageSender,
) {
    const tabId = sender.tab?.id;
    const logId = await getLogId(tabId);
    if (tabId === undefined || logId === undefined) return;

    const log = await getLogData(logId);
    if (log === undefined) return;

    const userId = convertNoToUserId(log, data);

    await sendMessageToContent(tabId, {
        type: "mount-user-id",
        data: userId ?? messages.ngUserId.cannotGetUserId,
    });
}

async function addNgUserIdFromDropdown(
    data: ExtractData<"add-ng-user-id-from-dropdown">,
    sender: browser.runtime.MessageSender,
) {
    const tabId = sender.tab?.id;
    const logId = await getLogId(tabId);
    if (tabId === undefined || logId === undefined) return;

    const log = await getLogData(logId);
    if (log === undefined) return;

    const videoId = log.tab?.videoId;
    const userId = convertNoToUserId(log, data);
    if (videoId === undefined || userId === undefined) {
        await sendNotification(messages.ngUserId.additionFailed);
        return;
    }

    await addNgUserId(
        new Set([data.specific ? `${videoId}@${userId}` : userId]),
    );

    const settings = await loadSettings();
    const tasks: Promise<void>[] = [];

    if (settings.isAutoReload) {
        tasks.push(sendMessageToContent(tabId, { type: "reload" }));
    }

    if (settings.isNotifyAddNgUserId) {
        tasks.push(sendNotification(messages.ngUserId.additionSuccess));
    }

    await Promise.all(tasks);
}

async function getCommentsFromDropdown(
    data: ExtractData<"get-comments-from-dropdown">,
    sender: browser.runtime.MessageSender,
) {
    const tabId = sender.tab?.id;
    const logId = await getLogId(tabId);
    if (tabId === undefined || logId === undefined) return;

    const log = await getLogData(logId);
    if (log === undefined) return;

    const userId = convertNoToUserId(log, data);
    if (userId === undefined) return;

    return log.commentFilterLog?.filtering?.renderedComments
        .filter((comment) => comment.userId === userId)
        .map((comment) => escapeNewline(comment.body))
        .sort((a, b) => a.localeCompare(b))
        .join("\n");
}

// https://github.com/nines75/mico/issues/46
function convertNoToUserId(
    log: LogData,
    data: {
        commentNo: number;
        body: string;
        isOwner: boolean;
    },
) {
    const comments = log.commentFilterLog?.filtering?.renderedComments.filter(
        (comment) => comment.no === data.commentNo,
    );
    if (comments === undefined || comments.length === 0) return;

    // コメント番号の重複なし
    if (comments.length === 1) {
        const comment = comments[0] as RenderedComment;

        return comment.userId;
    }

    // コメント番号の重複あり
    if (data.isOwner) {
        const target = comments.find(
            (comment) => comment.fork === "owner",
        ) as RenderedComment;

        return target.userId;
    } else {
        const filteredComments = comments.filter(
            (comment) => comment.body === data.body,
        );

        // コメントが特定できない場合
        if (filteredComments.length !== 1) return;

        const comment = filteredComments[0] as RenderedComment;
        return comment.userId;
    }
}

async function filterOldSearch(
    videos: NiconicoVideo[],
    sender: browser.runtime.MessageSender,
) {
    const settings = await loadSettings();

    const tabId = sender.tab?.id;
    if (tabId === undefined) return;

    const filteredData = filterVideo(videos, settings);
    if (filteredData === undefined) return;

    const logId = createLogId();

    await Promise.all([
        saveLog(filteredData, logId, tabId),
        tryMountLogId(logId, tabId),
        sendMessageToContent(tabId, {
            type: "remove-old-search",
            data: filteredData.filteredIds,
        }),
    ]);
    await cleanupDb();
}

async function disableIme() {
    await tryWithPermission("nativeMessaging", () => {
        const port = browser.runtime.connectNative("mico.ime");
        port.disconnect();
    });
}

async function restoreBadge(sender: browser.runtime.MessageSender) {
    const tabId = sender.tab?.id;
    const logId = await getLogId(tabId);
    if (tabId === undefined || logId === undefined) return;

    const log = await getLogData(logId);
    const count = log?.videoFilterLog?.count?.totalBlocked;
    if (count === undefined) return;

    await changeBadgeState(count, colors.videoBadge, tabId);
}
