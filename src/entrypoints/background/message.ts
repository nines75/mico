import { colors, messages } from "@/utils/config";
import { loadSettings } from "@/utils/storage";
import type { Settings } from "@/types/storage/settings.types";
import {
    setSettings,
    removeAllData,
    addAutoRule,
    removeAutoRule,
} from "@/utils/storage-write";
import { getLogData, setTabData } from "@/utils/db";
import type { TabData } from "@/types/storage/tab.types";
import {
    setBadgeState,
    sendMessageToContent,
    sendNotification,
} from "@/utils/browser";
import { getLogId } from "@/utils/log";
import { escapeNewline } from "@/utils/util";
import { getDropdownComment } from "./scripting";
import type { SetOptional } from "type-fest";
import type { AutoRule } from "./rule";

type ExtractData<
    T extends Extract<BackgroundMessage, { data: unknown }>["type"],
> = Extract<BackgroundMessage, { type: T }>["data"];

export type BackgroundMessage =
    // -------------------------------------------------------------------------------------------
    // このファイルの関数を呼び出すもの
    // -------------------------------------------------------------------------------------------
    | {
          type: "mount-to-dropdown";
      }
    | {
          type: "add-ng-user-id-from-dropdown";
          data: { isSpecific: boolean };
      }
    | {
          type: "get-comments-for-dropdown";
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
          type: "add-auto-rule";
          data: SetOptional<AutoRule, "id">[];
      }
    | {
          type: "remove-auto-rule";
          data: string[];
      }
    | {
          type: "get-log-data";
          data: string | undefined | null;
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
                await mountToDropdown(sender);
                break;
            }
            case "add-ng-user-id-from-dropdown": {
                await addNgUserIdFromDropdown(message.data, sender);
                break;
            }
            case "get-comments-for-dropdown": {
                return await getCommentsForDropdown(sender);
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
            case "add-auto-rule": {
                await addAutoRule(message.data);
                break;
            }
            case "remove-auto-rule": {
                await removeAutoRule(message.data);
                break;
            }
            case "get-log-data": {
                if (message.data === undefined || message.data === null) return;

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

async function mountToDropdown(sender: browser.runtime.MessageSender) {
    const tabId = sender.tab?.id;
    const comment = await getDropdownComment(sender);
    if (tabId === undefined || comment === undefined) return;

    const settings = await loadSettings();
    const texts: string[] = [];
    if (settings.isUserIdMountedToDropdown)
        texts.push(`ユーザーID：${comment.userId}`);
    if (settings.isNgScoreMountedToDropdown)
        texts.push(`NGスコア：${comment.score}`);

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
    const comment = await getDropdownComment(sender);
    if (tabId === undefined || comment?.$videoId === undefined) {
        await sendNotification(messages.ngUserId.additionFailed);
        return;
    }

    const settings = await loadSettings();
    await addAutoRule([
        {
            pattern: comment.userId,
            context: `comment-body: ${comment.body}`,
            source: "dropdown",
            target: { commentUserId: true },
            ...(data.isSpecific && {
                include: { videoIds: [[comment.$videoId]] },
            }),
        },
    ]);

    const tasks: Promise<unknown>[] = [];
    if (settings.isAutoReload)
        tasks.push(sendMessageToContent(tabId, { type: "reload" }));
    if (settings.isNotifyAddNgUserId)
        tasks.push(sendNotification(messages.ngUserId.additionSuccess));

    await Promise.all(tasks);
}

async function getCommentsForDropdown(sender: browser.runtime.MessageSender) {
    const tabId = sender.tab?.id;
    const logId = await getLogId(tabId);
    if (tabId === undefined || logId === undefined) return;

    const log = await getLogData(logId);
    if (log === undefined) return;

    const dropdownComment = await getDropdownComment(sender);
    const userId = dropdownComment?.userId;
    if (userId === undefined) return;

    return log.comment?.renderedComments
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
    const count = log?.count?.blockedVideo;
    if (count === undefined) return;

    await setBadgeState(count, colors.videoBadge, tabId);
}
