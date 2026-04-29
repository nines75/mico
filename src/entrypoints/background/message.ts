import { loadSettings } from "@/utils/storage";
import {
  setSettings,
  removeAllData,
  addAutoRule,
  removeAutoRule,
} from "@/utils/storage-write";
import { getLog, setTab } from "@/utils/db";
import { setBadgeState, sendMessageToTab, notify } from "@/utils/browser";
import { getLogId } from "@/utils/log";
import { escapeNewline } from "@/utils/util";
import { getDropdownComment } from "./scripting";

export type BackgroundMessage =
  // -------------------------------------------------------------------------------------------
  // このファイルの関数を呼び出すもの
  // -------------------------------------------------------------------------------------------
  | {
      type: "on-click-dropdown";
      data?: Parameters<typeof onClickDropdown>[0];
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
      data: Parameters<typeof setSettings>[0];
    }
  | {
      type: "set-tab";
      data: Parameters<typeof setTab>[0];
    }
  | {
      type: "remove-all-data";
    }
  | {
      type: "add-auto-rule";
      data: Parameters<typeof addAutoRule>[0];
    }
  | {
      type: "remove-auto-rule";
      data: Parameters<typeof removeAutoRule>[0];
    }
  | {
      type: "get-log";
      data: Parameters<typeof getLog>[0] | undefined | null;
    }
  | {
      type: "get-dropdown-comment";
    }
  | {
      type: "notify";
      data: Parameters<typeof notify>[0];
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
      case "on-click-dropdown": {
        await onClickDropdown(message.data, sender);
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
      case "set-tab": {
        const tabId = sender.tab?.id;
        if (tabId !== undefined) {
          await setTab(message.data, tabId);
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
      case "get-log": {
        if (message.data === undefined || message.data === null) return;

        return await getLog(message.data);
      }
      case "get-dropdown-comment": {
        return await getDropdownComment(sender);
      }
      case "notify": {
        await notify(message.data);
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

async function onClickDropdown(
  data: { videoOnly: boolean } | undefined,
  sender: browser.runtime.MessageSender,
) {
  const tabId = sender.tab?.id;
  const comment = await getDropdownComment(sender);
  if (tabId === undefined || comment?.$videoId === undefined) {
    await notify("NG登録に失敗しました");
    return;
  }

  const settings = await loadSettings();
  await addAutoRule([
    {
      pattern: comment.userId,
      context: `comment-body: ${comment.body}`,
      source: "dropdown",
      target: { commentUserId: true },
      ...(data?.videoOnly === true && {
        include: { videoIds: [[comment.$videoId]] },
      }),
    },
  ]);

  const tasks: Promise<unknown>[] = [];
  if (settings.autoReload)
    tasks.push(sendMessageToTab(tabId, { type: "reload" }));
  if (settings.notifyOnManualNg && !settings.autoReload)
    tasks.push(notify(`以下のユーザーIDをNG登録しました\n\n${comment.userId}`));

  await Promise.all(tasks);
}

async function getCommentsForDropdown(sender: browser.runtime.MessageSender) {
  const tabId = sender.tab?.id;
  const logId = await getLogId(tabId);
  if (tabId === undefined || logId === undefined) return;

  const log = await getLog(logId);
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

  const log = await getLog(logId);
  const count = log?.count?.blockedVideo;
  if (count === undefined) return;

  await setBadgeState(count, "video", tabId);
}
