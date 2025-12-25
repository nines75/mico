import { filterComment } from "../comment-filter/filter-comment.js";
import { saveLog } from "../comment-filter/save-log.js";
import { messages } from "@/utils/config.js";
import { loadSettings } from "@/utils/storage.js";
import { isWatchPage, replace, sendNotification } from "@/utils/util.js";
import { filterResponse } from "./request.js";
import { addNgUserId } from "@/utils/storage-write.js";
import { sendMessageToContent } from "@/entrypoints/content/message.js";
import { CommentApi, commentApiSchema } from "@/types/api/comment.types.js";
import { cleanupDb, getTabData, setTabData } from "@/utils/db.js";
import { TabData } from "@/types/storage/tab.types.js";
import { safeParseJson } from "./safe-parse-json.js";

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
            tabData.tags,
            tabData.videoId,
        );
        if (filteredData === undefined) return true;

        filter.write(encoder.encode(JSON.stringify(commentApi)));
        filter.disconnect();

        // ログをソートするときに参照するので先に保存する
        const strictUserIds = filteredData.strictUserIdsWithContext;
        if (strictUserIds.size > 0) {
            await addNgUserId(strictUserIds);
        }

        const tasks: Promise<void>[] = [];

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
