import { filterComment } from "../comment-filter/filter-comment";
import { saveLog } from "../comment-filter/save-log";
import { loadSettings } from "@/utils/storage";
import { isWatchPage } from "@/utils/util";
import { filterResponse } from "./request";
import { addAutoRule, addContextToAutoRule } from "@/utils/storage-write";
import type { CommentApi } from "@/types/api/comment-api.types";
import { commentApiSchema } from "@/types/api/comment-api.types";
import { cleanUpDb, getTab, setTab } from "@/utils/db";
import type { Tab } from "@/types/storage/tab.types";
import { notify } from "@/utils/browser";
import { safeParseJson } from "@/utils/util";
import { sendMessage } from "@/utils/messaging";

export default function commentRequest(
  details: browser.webRequest._OnBeforeRequestDetails,
) {
  filterResponse(details, "POST", async (filter, encoder, buf) => {
    const tabId = details.tabId;
    const [settings, tab, { url }] = await Promise.all([
      loadSettings(),
      getTab(tabId),
      browser.tabs.get(tabId),
    ]);

    // プレビュー再生のコメントをフィルタリングしないように視聴ページか判定
    if (tab === undefined || !isWatchPage(url)) return true;

    // フィルタリングするかに関わらず実行する処理
    await restorePlaybackTime(tabId, tab);

    const logId = tab.logId;
    if (logId === undefined) return true;

    const commentApi: CommentApi | undefined = safeParseJson(
      buf,
      commentApiSchema,
    );
    if (commentApi === undefined) return true;

    const result = filterComment(commentApi.data.threads, settings, tab);
    if (result === undefined) return true;

    filter.write(encoder.encode(JSON.stringify(commentApi)));
    filter.disconnect();

    const tasks: Promise<void>[] = [saveLog(result, logId, tabId), cleanUpDb()];

    const strictData = result.strictData;
    if (strictData.length > 0) {
      // 通知を送信
      if (settings.notifyOnAutoNg) {
        tasks.push(
          notify(`${strictData.length}件のユーザーIDをNG登録しました`),
        );
      }

      // strictルールによってフィルタリングされたユーザーIDをNG登録
      tasks.push(
        addAutoRule(
          strictData.map((data) => {
            return {
              pattern: data.userId,
              context: data.context,
              source: "strict",
              target: { commentUserId: true },
              ...(data.ruleId !== undefined && {
                id: data.ruleId,
              }),
            };
          }),
        ),
      );
    }

    if (settings.complementContext) {
      tasks.push(
        addContextToAutoRule({
          type: "comment",
          comments: result.allComments,
          tab,
        }),
      );
    }

    await Promise.all(tasks);

    return false;
  });
}

async function restorePlaybackTime(tabId: number, tab: Tab) {
  const playbackTime = tab.playbackTime ?? 0;
  if (playbackTime <= 0) return;

  await Promise.all([
    setTab({ playbackTime: 0 }, tabId),
    sendMessage("setPlaybackTime", playbackTime, tabId),
  ]);
}
