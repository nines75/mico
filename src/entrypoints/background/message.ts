import { messages } from "@/utils/config.js";
import { getLogData, loadSettings } from "@/utils/storage.js";
import {
    createLogId,
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
    setLog,
    setSettings,
    removeAllData,
    addNgUserId,
    removeNgUserId,
    addNgId,
    removeNgId,
} from "@/utils/storage-write.js";
import { sendMessageToContent } from "../content/message.js";
import { PartialDeep } from "type-fest";
import { LogData } from "@/types/storage/log.types.js";

type BackgroundMessage =
    | {
          type: "get-user-id-for-mount";
          data: number;
      }
    | {
          type: "add-ng-user-id-from-dropdown";
          data: {
              commentNo: number;
              specific: boolean;
          };
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
          type: "set-log";
          data: PartialDeep<LogData>;
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
      };

export async function sendMessageToBackground(message: BackgroundMessage) {
    await browser.runtime.sendMessage(message);
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
            case "filter-old-search": {
                await filterOldSearch(message.data, sender);
                break;
            }
            case "set-settings": {
                await setSettings(message.data);
                break;
            }
            case "set-log": {
                const tabId = sender.tab?.id;
                if (tabId !== undefined) {
                    await setLog(message.data, tabId, tabId);
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
        }
    } catch (e) {
        console.error(e);
    }
}

async function getUserIdForMount(
    commentNo: number,
    sender: browser.runtime.MessageSender,
) {
    const tabId = sender.tab?.id;
    const logId = await getLogId(tabId);
    if (tabId === undefined || logId === undefined) return;

    const logData = await getLogData(logId, tabId);
    const userId =
        logData?.commentFilterLog?.filtering.noToUserId.get(commentNo);
    if (userId === undefined) return;

    await sendMessageToContent(tabId, {
        type: "mount-user-id",
        data: userId,
    });
}

async function addNgUserIdFromDropdown(
    data: Extract<
        BackgroundMessage,
        { type: "add-ng-user-id-from-dropdown" }
    >["data"],
    sender: browser.runtime.MessageSender,
) {
    const tabId = sender.tab?.id;
    const logId = await getLogId(tabId);
    if (tabId === undefined || logId === undefined) return;

    const log = await getLogData(logId, tabId);
    const videoId = log?.videoId ?? undefined;
    const userId = log?.commentFilterLog?.filtering.noToUserId.get(
        data.commentNo,
    );
    if (log === undefined || videoId === undefined || userId === undefined) {
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
    // await cleanupStorage();
}

async function disableIme() {
    await tryWithPermission("nativeMessaging", () => {
        const port = browser.runtime.connectNative("mico.ime");
        port.disconnect();
    });
}
