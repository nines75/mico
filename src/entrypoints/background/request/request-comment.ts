import { CommentDataContainer } from "@/types/api/comment.types.js";
import { filterComment } from "../comment-filter/filter-comment.js";
import { saveVideoLog } from "../comment-filter/save-video-log.js";
import { texts, pattern } from "@/utils/config.js";
import {
    loadSettings,
    getLogData,
    getAllData,
    removeData,
    LogType,
} from "@/utils/storage.js";
import {
    extractVideoId,
    sendNotification,
    saveProcessingTime,
    savePlaybackTime,
} from "@/utils/util.js";
import { addNgUserId } from "../comment-filter/filter/user-id-filter.js";

export default function commentRequest(
    details: browser.webRequest._OnBeforeRequestDetails
) {
    if (details.method !== "POST") return;

    const filter = browser.webRequest.filterResponseData(details.requestId);
    const decoder = new TextDecoder("utf-8");
    const encoder = new TextEncoder();

    let buf = "";
    filter.ondata = (event) => {
        buf += decoder.decode(event.data, { stream: true });
    };

    filter.onstop = async () => {
        try {
            const commentData = JSON.parse(buf) as CommentDataContainer;
            const settings = await loadSettings();
            const tabId = details.tabId;

            // 動画IDを取得
            const tab = await browser.tabs.get(tabId);
            const videoId = extractVideoId(tab.url);

            const [filteredData] = await Promise.all([
                filterComment(commentData.data.threads, settings, videoId),
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
            if (settings.isSaveFilteringLog) {
                tasks.push(saveVideoLog(filteredData, tabId));
            }

            // 通知を送信
            if (strictNgUserIds.size > 0 && settings.isNotifyStrictRule) {
                tasks.push(
                    sendNotification(
                        texts.content.messageNotifyAddNgUserId.replace(
                            "{target}",
                            strictNgUserIds.size.toString()
                        )
                    )
                );
            }

            // フィルタリングの処理時間を保存
            tasks.push(
                saveProcessingTime(
                    [
                        ["filtering", filteredData.filteringTime],
                        ["fetchTag", filteredData.fetchTagTime],
                    ],
                    tabId
                )
            );

            await Promise.all(tasks);
            await cleanupStorage();
        } catch (e) {
            console.error(e);
        }
    };
}

async function restorePlaybackTime(tabId: number) {
    const tasks: Promise<void>[] = [];

    const logData = await getLogData(tabId);
    const playbackTime = logData?.playbackTime ?? 0;
    if (playbackTime > 0) {
        tasks.push(savePlaybackTime(tabId, 0));
        tasks.push(
            browser.tabs.sendMessage(tabId, {
                type: "set-playback-time",
                data: playbackTime,
            })
        );
    }

    await Promise.all(tasks);
}

async function cleanupStorage() {
    const [tabs, data] = await Promise.all([
        browser.tabs.query({ url: pattern.watchPageUrlGlob }), // 残すのは現在視聴ページを開いてるタブのログだけでいい
        getAllData(),
    ]);
    const aliveTabKeys = new Set(tabs.map((tab) => `log-${tab.id}`));

    const keys: LogType[] = [];
    for (const key of Object.keys(data)) {
        if (key.startsWith("log-") && !aliveTabKeys.has(key)) {
            keys.push(key as LogType);
        }
    }

    await removeData(keys);
}
