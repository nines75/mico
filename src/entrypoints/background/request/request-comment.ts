import { CommentDataContainer } from "@/types/api/comment.types.js";
import { filterComment } from "../comment-filter/filter-comment.js";
import { saveLog } from "../comment-filter/save-log.js";
import { pattern, messages } from "@/utils/config.js";
import {
    loadSettings,
    getLogData,
    getAllData,
    removeData,
    LogType,
    setLog,
} from "@/utils/storage.js";
import { sendNotification, savePlaybackTime } from "@/utils/util.js";
import { addNgUserId } from "../comment-filter/filter/user-id-filter.js";

export default function commentRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
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
            tasks.push(
                setLog(
                    {
                        commentFilterLog: {
                            processingTime: {
                                filtering: filteredData.filteringTime,
                            },
                        },
                    },
                    tabId,
                ),
            );

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
                data: playbackTime satisfies number,
            }),
        );
    }

    await Promise.all(tasks);
}

async function cleanupStorage() {
    const [tabs, data] = await Promise.all([
        browser.tabs.query({ url: pattern.watchPageUrlGlob }), // 残すのは現在視聴ページを開いてるタブのログだけでいい
        getAllData(),
    ]);
    const aliveTabKeys = new Set(
        tabs
            .map((tab) => tab.id)
            .filter((id) => id !== undefined)
            .map((id) => `log-${id}`),
    );

    const keys: LogType[] = [];
    for (const key of Object.keys(data)) {
        if (key.startsWith("log-") && !aliveTabKeys.has(key)) {
            keys.push(key as LogType);
        }
    }

    await removeData(keys);
}
