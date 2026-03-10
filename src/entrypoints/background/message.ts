import { colors, messages } from "@/utils/config";
import { loadSettings } from "@/utils/storage";
import type { Settings } from "@/types/storage/settings.types";
import {
    setSettings,
    removeAllData,
    addNgUserId,
    removeNgUserId,
    addNgId,
    removeNgId,
} from "@/utils/storage-write";
import { getLogData, setTabData } from "@/utils/db";
import type { TabData } from "@/types/storage/tab.types";
import type { LogData } from "@/types/storage/log.types";
import type { DropdownComment } from "../content/dropdown";
import { formatNgUserId } from "./comment-filter/filter/user-id-filter";
import {
    setBadgeState,
    sendMessageToContent,
    sendNotification,
} from "@/utils/browser";
import { getLogId } from "@/utils/log";
import { escapeNewline } from "@/utils/util";

type ExtractData<
    T extends Extract<BackgroundMessage, { data: unknown }>["type"],
> = Extract<BackgroundMessage, { type: T }>["data"];

export type BackgroundMessage =
    // -------------------------------------------------------------------------------------------
    // このファイルの関数を呼び出すもの
    // -------------------------------------------------------------------------------------------
    | {
          type: "mount-to-dropdown";
          data: DropdownComment;
      }
    | {
          type: "add-ng-user-id-from-dropdown";
          data: DropdownComment & { isSpecific: boolean };
      }
    | {
          type: "get-comments-from-dropdown";
          data: DropdownComment;
      }
    | {
          type: "restore-badge";
      }
    // -------------------------------------------------------------------------------------------
    // 他のファイルの関数を呼び出すもの
    // -------------------------------------------------------------------------------------------
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
          data: string[];
      }
    | {
          type: "remove-ng-user-id";
          data: {
              userIds: string[];
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
          type: "get-log-data";
          data: string;
      }
    | {
          type: "send-notification";
          data: string;
      };

export async function backgroundMessageHandler(
    message: BackgroundMessage,
    sender: browser.runtime.MessageSender,
) {
    // エラーの発生箇所を出力するためにメッセージ受信側でエラーを出力
    try {
        if (sender.id !== browser.runtime.id) return;

        switch (message.type) {
            // -------------------------------------------------------------------------------------------
            // このファイルの関数を呼び出すもの
            // -------------------------------------------------------------------------------------------
            case "mount-to-dropdown": {
                await mountToDropdown(message.data, sender);
                break;
            }
            case "add-ng-user-id-from-dropdown": {
                await addNgUserIdFromDropdown(message.data, sender);
                break;
            }
            case "get-comments-from-dropdown": {
                return await getCommentsFromDropdown(message.data, sender);
            }
            case "restore-badge": {
                await restoreBadge(sender);
                break;
            }
            // -------------------------------------------------------------------------------------------
            // 他のファイルの関数を呼び出すもの
            // -------------------------------------------------------------------------------------------
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
            case "get-log-data": {
                return await getLogData(message.data);
            }
            case "send-notification": {
                await sendNotification(message.data);
                break;
            }
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// -------------------------------------------------------------------------------------------
// メッセージを処理する関数
// -------------------------------------------------------------------------------------------

async function mountToDropdown(
    data: ExtractData<"mount-to-dropdown">,
    sender: browser.runtime.MessageSender,
) {
    const tabId = sender.tab?.id;
    const logId = await getLogId(tabId);
    if (tabId === undefined || logId === undefined) return;

    const log = await getLogData(logId);
    if (log === undefined) return;

    const settings = await loadSettings();
    const comment = convertNoToComment(log, data);
    const score = comment?.score;

    const texts: string[] = [];
    if (settings.isUserIdMountedToDropdown) {
        texts.push(
            `ユーザーID：${comment?.userId ?? messages.ngUserId.cannotGetUserId}`,
        );
    }
    if (settings.isNgScoreMountedToDropdown && score !== undefined) {
        texts.push(`NGスコア：${score}`);
    }

    if (texts.length > 0) {
        await sendMessageToContent(tabId, {
            type: "mount-to-dropdown",
            data: texts,
        });
    }
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
    const userId = convertNoToComment(log, data)?.userId;
    if (videoId === undefined || userId === undefined) {
        await sendNotification(messages.ngUserId.additionFailed);
        return;
    }

    const settings = await loadSettings();
    await addNgUserId([
        formatNgUserId(
            data.isSpecific ? `@v ${videoId}\n${userId}` : userId,
            `body(dropdown): ${data.body}`,
            settings,
        ),
    ]);

    const tasks: Promise<unknown>[] = [];
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

    const userId = convertNoToComment(log, data)?.userId;
    if (userId === undefined) return;

    return log.commentFilterLog?.filtering?.renderedComments
        .filter((comment) => comment.userId === userId)
        .toSorted((a, b) => a.body.localeCompare(b.body))
        .toSorted((a, b) => a.score - b.score)
        .map(
            (comment) =>
                `${comment.score < 0 ? `[🚫:${comment.score}]` : ""}${escapeNewline(comment.body)}`,
        )
        .join("\n");
}

async function restoreBadge(sender: browser.runtime.MessageSender) {
    const tabId = sender.tab?.id;
    const logId = await getLogId(tabId);
    if (tabId === undefined || logId === undefined) return;

    const log = await getLogData(logId);
    const count = log?.videoFilterLog?.count?.totalBlocked;
    if (count === undefined) return;

    await setBadgeState(count, colors.videoBadge, tabId);
}

// -------------------------------------------------------------------------------------------
// 重複をまとめる関数
// -------------------------------------------------------------------------------------------

// https://github.com/nines75/mico/issues/46
function convertNoToComment(log: LogData, data: DropdownComment) {
    const comments = log.commentFilterLog?.filtering?.renderedComments.filter(
        ({ no }) => no === data.commentNo,
    );
    if (comments === undefined || comments.length === 0) return;

    // コメント番号の重複なし
    if (comments.length === 1) return comments[0];

    // コメント番号の重複あり
    if (data.isOwner) {
        return comments.find(({ fork }) => fork === "owner");
    } else {
        const filteredComments = comments.filter(
            ({ body }) => body === data.body,
        );

        // コメントが特定できない場合
        if (filteredComments.length !== 1) return;

        return filteredComments[0];
    }
}
