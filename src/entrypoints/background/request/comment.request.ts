import { filterComment } from "../comment-filter/filter-comment";
import { saveLog } from "../comment-filter/save-log";
import { messages } from "@/utils/config";
import { loadSettings } from "@/utils/storage";
import { isWatchPage, replace } from "@/utils/util";
import { filterResponse } from "./request";
import { addNgUserId } from "@/utils/storage-write";
import type { CommentApi } from "@/types/api/comment.types";
import { commentApiSchema } from "@/types/api/comment.types";
import { cleanupDb, getTabData, setTabData } from "@/utils/db";
import type { TabData } from "@/types/storage/tab.types";
import { sendMessageToContent, sendNotification } from "@/utils/browser";
import { safeParseJson } from "@/utils/util";

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
        if (strictUserIds.length > 0 && settings.isNotifyAutoAddNgUserId) {
            tasks.push(
                sendNotification(
                    replace(messages.ngUserId.notifyAddition, [
                        strictUserIds.length.toString(),
                    ]),
                ),
            );
        }

        // strictルールによってフィルタリングされたユーザーIDをNG登録
        if (strictUserIds.length > 0) {
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

    await Promise.all([
        setTabData({ playbackTime: 0 }, tabId),
        sendMessageToContent(tabId, {
            type: "set-playback-time",
            data: playbackTime,
        }),
    ]);
}
