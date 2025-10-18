import { filterComment } from "../comment-filter/filter-comment.js";
import { saveLog } from "../comment-filter/save-log.js";
import { messages } from "@/utils/config.js";
import { loadSettings } from "@/utils/storage.js";
import { safeParseJson, sendNotification } from "@/utils/util.js";
import { filterResponse } from "./request.js";
import { addNgUserId } from "@/utils/storage-write.js";
import { sendMessageToContent } from "@/entrypoints/content/message.js";
import { CommentApi, commentApiSchema } from "@/types/api/comment.types.js";
import { cleanupDb, getTabData, setTabData } from "@/utils/db.js";
import { TabData } from "@/types/storage/tab.types.js";

export default function commentRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "POST", async (filter, encoder, buf) => {
        const tabId = details.tabId;
        const [settings, tab] = await Promise.all([
            loadSettings(),
            getTabData(tabId),
        ]);
        if (tab === undefined) return true;

        // フィルタリングするかに関わらず実行する処理
        await restorePlaybackTime(tabId, tab);

        const logId = tab.logId;
        if (logId === undefined) return true;

        const commentApi: CommentApi | undefined = safeParseJson(
            buf,
            commentApiSchema,
        );
        if (commentApi === undefined) return true;

        const filteredData = filterComment(
            commentApi.data.threads,
            settings,
            tab.tags,
            tab.videoId,
        );
        if (filteredData === undefined) return true;

        filter.write(encoder.encode(JSON.stringify(commentApi)));
        filter.disconnect();

        // ログをソートするときに参照するので先に保存する
        const strictNgUserIds = filteredData.strictNgUserIds;
        if (strictNgUserIds.size > 0) {
            await addNgUserId(strictNgUserIds);
        }

        const tasks: Promise<void>[] = [];

        // ログを保存
        tasks.push(saveLog(filteredData, logId, tabId));

        // 通知を送信
        if (strictNgUserIds.size > 0 && settings.isNotifyAutoAddNgUserId) {
            tasks.push(
                sendNotification(
                    messages.ngUserId.notifyAddition.replace(
                        "{target}",
                        strictNgUserIds.size.toString(),
                    ),
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

    const tasks: Promise<void>[] = [];
    tasks.push(setTabData({ playbackTime: 0 }, tabId));
    tasks.push(
        sendMessageToContent(tabId, {
            type: "set-playback-time",
            data: playbackTime,
        }),
    );

    await Promise.all(tasks);
}
