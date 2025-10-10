import { isNgVideo } from "../video-filter/filter-video.js";
import { loadSettings } from "@/utils/storage.js";
import { Settings } from "@/types/storage/settings.types.js";
import { LogData, SeriesData } from "@/types/storage/log.types.js";
import { filterResponse, spaFilter } from "./request.js";
import { pattern } from "@/utils/config.js";
import { setLog } from "@/utils/storage-write.js";
import { WatchApi, watchApiSchema } from "@/types/api/watch.types.js";

export function watchRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const settings = await loadSettings();

        const res = spaFilter(
            details,
            buf,
            settings,
            watchApiSchema,
            watchApiFilter,
        );
        if (res === undefined) return true;

        const { filteredBuf, filteredData } = res;

        // 以降のリクエストで使用するためフィルタを切断する前に保存する
        await setLog(filteredData, details.tabId);

        filter.write(encoder.encode(filteredBuf));
        filter.disconnect();

        return false;
    });
}

function watchApiFilter(
    watchApi: WatchApi,
    settings: Settings,
    meta?: Element | null,
): LogData {
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

                if (settings.isHideCommentPreview && series.next !== null) {
                    series.next.latestCommentSummary = "";
                }

                meta?.setAttribute("content", JSON.stringify(watchApi));
            }

            return { hasNext: true, data: video };
        } else {
            return { hasNext: false };
        }
    })();

    const videoId = response.video?.id ?? null;
    const title = response.video?.title ?? null;
    const userId =
        response.owner?.id ?? // 通常のユーザー
        response.channel?.id ?? // チャンネル
        metadata.jsonLds[0]?.author?.url.match(
            pattern.regex.extractUserId, // 誤った値が抽出されないように完全なURLでチェックする
        )?.[1] ?? // ユーザーが退会済み
        null;
    const userName =
        response.owner?.nickname ??
        response.channel?.name ??
        metadata.jsonLds[0]?.author?.name ??
        null;
    const tags = response.tag?.items.map((data) => data.name) ?? [];

    return {
        series: seriesData,
        videoId,
        title,
        userId,
        userName,
        tags,
    };
}
