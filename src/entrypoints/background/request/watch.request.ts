import { isNgVideo } from "../video-filter/filter-video";
import { loadSettings } from "@/utils/storage";
import type { Settings } from "@/types/storage/settings.types";
import { filterResponse, spaFilter } from "./request";
import type { WatchApi } from "@/types/api/watch.types";
import { watchApiSchema } from "@/types/api/watch.types";
import { setLog, setTabData } from "@/utils/db";
import type { SeriesData, TabData } from "@/types/storage/tab.types";
import { createLogId, tryMountLogId } from "@/utils/log";

export function watchRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const tabId = details.tabId;

        // 削除動画でもログIDを更新するためにcomment/recommendではなくここで生成する
        const logId = createLogId();
        if (details.type === "xmlhttprequest") {
            await tryMountLogId(logId, tabId);
        }

        const settings = await loadSettings();
        const res = spaFilter(
            details,
            buf,
            settings,
            watchApiSchema,
            watchApiFilter,
        );
        if (res === undefined) return true;

        const { filteredBuf, filteredData: tabData } = res;

        tabData.logId = logId;

        await Promise.all([
            setTabData(tabData, tabId), // 以降のリクエストで使用するためフィルタを切断する前に保存する
            setLog({ tab: tabData }, logId, tabId),
        ]);

        filter.write(encoder.encode(filteredBuf));
        filter.disconnect();

        if (details.type === "main_frame") {
            await tryMountLogId(logId, tabId);
        }

        return false;
    });
}

function watchApiFilter(
    watchApi: WatchApi,
    settings: Settings,
    meta?: Element | null,
): TabData {
    const response = watchApi.data.response;
    const metadata = watchApi.data.metadata;

    const seriesData: SeriesData = (() => {
        const series = response.series?.video;
        const video = series?.next;

        if (series !== undefined && video !== null && video !== undefined) {
            if (settings.isVideoFilterEnabled) {
                if (isNgVideo(video, settings)) {
                    series.next = null;
                }

                if (settings.isCommentPreviewHidden && series.next !== null) {
                    series.next.latestCommentSummary = "";
                }

                meta?.setAttribute("content", JSON.stringify(watchApi));
            }

            return { hasNext: true, data: video };
        } else {
            return { hasNext: false };
        }
    })();

    const userId = (
        response.owner?.id ?? // 通常のユーザー
        response.channel?.id ?? // チャンネル
        // ユーザーが退会済み
        metadata.jsonLds[0]?.author?.url.match(
            /^https:\/\/www\.nicovideo\.jp\/user\/(\d+)$/, // 誤った値が抽出されないように完全なURLでチェックする
        )?.[1]
    )?.toString();
    const userName =
        response.owner?.nickname ??
        response.channel?.name ??
        metadata.jsonLds[0]?.author?.name;
    const tags = response.tag.items.map(({ name }) => name);

    return {
        series: seriesData,
        seriesId: response.series?.id.toString(),
        videoId: response.video.id,
        title: response.video.title,
        userId,
        userName,
        tags,
    };
}
