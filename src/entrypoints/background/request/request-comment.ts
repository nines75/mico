import { CommentDataContainer } from "@/types/api/comment.types.js";
import { filterComment } from "../comment-filter/filter-comment.js";
import { saveLog } from "../comment-filter/save-log.js";
import { messages } from "@/utils/config.js";
import { loadSettings, getLogData } from "@/utils/storage.js";
import { sendNotification } from "@/utils/util.js";
import { filterResponse } from "./request.js";
import { addNgUserId, setLog, cleanupStorage } from "@/utils/storage-write.js";
import { sendMessageToContent } from "@/entrypoints/content/message.js";

export default function commentRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "POST", async (filter, encoder, buf) => {
        const commentData = JSON.parse(buf) as CommentDataContainer;
        const [settings, log] = await Promise.all([
            loadSettings(),
            getLogData(details.tabId),
        ]);
        const tabId = details.tabId;
        const videoId = log?.videoId ?? undefined;

        const [filteredData] = await Promise.all([
            filterComment(
                commentData.data?.threads,
                settings,
                log?.tags ?? [],
                videoId,
            ),
            restorePlaybackTime(tabId),
        ]);

        filter.write(encoder.encode(JSON.stringify(commentData)));
        filter.disconnect();

        if (filteredData === undefined || videoId === undefined) return;

        // ログをソートするときに参照するので先に保存する
        const strictNgUserIds = filteredData.strictNgUserIds;
        if (strictNgUserIds.size > 0) {
            await addNgUserId(strictNgUserIds);
        }

        const tasks: Promise<void>[] = [];

        // ログを保存
        tasks.push(saveLog(filteredData, tabId));

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
        await cleanupStorage();
    });
}

async function restorePlaybackTime(tabId: number) {
    const tasks: Promise<void>[] = [];

    const logData = await getLogData(tabId);
    const playbackTime = logData?.playbackTime ?? 0;
    if (playbackTime > 0) {
        tasks.push(setLog({ playbackTime: 0 }, tabId));
        tasks.push(
            sendMessageToContent(tabId, {
                type: "set-playback-time",
                data: playbackTime,
            }),
        );
    }

    await Promise.all(tasks);
}
