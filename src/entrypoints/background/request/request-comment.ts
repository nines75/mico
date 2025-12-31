import { filterComment } from "../comment-filter/filter-comment.js";
import { saveLog } from "../comment-filter/save-log.js";
import { messages } from "@/utils/config.js";
import { loadSettings } from "@/utils/storage.js";
import { isWatchPage, replace, sendNotification } from "@/utils/util.js";
import { filterResponse } from "./request.js";
import { addNgUserId } from "@/utils/storage-write.js";
import type { CommentApi } from "@/types/api/comment.types.js";
import { commentApiSchema } from "@/types/api/comment.types.js";
import { cleanupDb, getTabData, setTabData } from "@/utils/db.js";
import type { TabData } from "@/types/storage/tab.types.js";
import { safeParseJson } from "./safe-parse-json.js";
import { sendMessageToContent } from "@/utils/browser.js";

export default function commentRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "POST", async (filter, encoder, buf) => {
        const tabId = details.tabId;
        const [settings, tabData, tab] = await Promise.all([
            loadSettings(),
            getTabData(tabId),
            browser.tabs.get(tabId),
        ]);

        // プレビュー再生のコメントをフィルタリングしないように視聴ページか判定
        if (tabData === undefined || !isWatchPage(tab.url)) return true;

        // フィルタリングするかに関わらず実行する処理
        await restorePlaybackTime(tabId, tabData);

        const logId = tabData.logId;
        if (logId === undefined) return true;

        const commentApi: CommentApi | undefined = safeParseJson(
            buf,
            commentApiSchema,
        );
        if (commentApi === undefined) return true;

        const filteredData = filterComment(
            commentApi.data.threads,
            settings,
            tabData,
        );
        if (filteredData === undefined) return true;

        filter.write(encoder.encode(JSON.stringify(commentApi)));
        filter.disconnect();

        const tasks: Promise<void>[] = [];
        const strictUserIds = filteredData.strictUserIdsWithContext;

        // ログを保存
        tasks.push(saveLog(filteredData, logId, tabId));

        // 通知を送信
        if (strictUserIds.size > 0 && settings.isNotifyAutoAddNgUserId) {
            tasks.push(
                sendNotification(
                    replace(messages.ngUserId.notifyAddition, [
                        strictUserIds.size.toString(),
                    ]),
                ),
            );
        }

        // strictルールによってフィルタリングされたユーザーIDをNG登録
        if (strictUserIds.size > 0) {
            tasks.push(addNgUserId(strictUserIds));
        }

        await Promise.all(tasks);
        await cleanupDb();

        return false;
    });
}

async function restorePlaybackTime(tabId: number, tabData: TabData) {
    const playbackTime = tabData.playbackTime ?? 0;
    if (playbackTime <= 0) return;

    const tasks: Promise<unknown>[] = [];
    tasks.push(setTabData({ playbackTime: 0 }, tabId));
    tasks.push(
        sendMessageToContent(tabId, {
            type: "set-playback-time",
            data: playbackTime,
        }),
    );

    await Promise.all(tasks);
}
