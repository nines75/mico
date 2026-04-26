import { filterComment } from "../comment-filter/filter-comment";
import { saveLog } from "../comment-filter/save-log";
import { messages } from "@/utils/config";
import { loadSettings } from "@/utils/storage";
import { isWatchPage, replace } from "@/utils/util";
import { filterResponse } from "./request";
import { addAutoRule } from "@/utils/storage-write";
import type { CommentApi } from "@/types/api/comment-api.types";
import { commentApiSchema } from "@/types/api/comment-api.types";
import { cleanUpDb, getTab, setTab } from "@/utils/db";
import type { Tab } from "@/types/storage/tab.types";
import { sendMessageToContent, notify } from "@/utils/browser";
import { safeParseJson } from "@/utils/util";

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

        const tasks: Promise<void>[] = [];
        const strictData = result.strictData;

        // ログを保存
        tasks.push(saveLog(result, logId, tabId));

        // 通知を送信
        if (strictData.length > 0 && settings.notifyOnAutoNg) {
            tasks.push(
                notify(
                    replace(messages.ngUserId.notifyAddition, [
                        strictData.length.toString(),
                    ]),
                ),
            );
        }

        // strictルールによってフィルタリングされたユーザーIDをNG登録
        if (strictData.length > 0) {
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

        await Promise.all(tasks);
        await cleanUpDb();

        return false;
    });
}

async function restorePlaybackTime(tabId: number, tab: Tab) {
    const playbackTime = tab.playbackTime ?? 0;
    if (playbackTime <= 0) return;

    await Promise.all([
        setTab({ playbackTime: 0 }, tabId),
        sendMessageToContent(tabId, {
            type: "set-playback-time",
            data: playbackTime,
        }),
    ]);
}
