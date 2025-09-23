import { isNgVideo } from "../video-filter/filter-video.js";
import { loadSettings } from "@/utils/storage.js";
import { Settings } from "@/types/storage/settings.types.js";
import { SeriesData } from "@/types/storage/log.types.js";
import { filterResponse } from "./request.js";
import { MainData } from "@/types/api/main.types.js";
import { pattern } from "@/utils/config.js";
import { setLog } from "@/utils/storage-write.js";

export function mainRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const settings = await loadSettings();

        filter.write(
            encoder.encode(
                details.type === "main_frame"
                    ? await mainFrameFilter(details, buf, settings)
                    : await xhrFilter(details, buf, settings),
            ),
        );
        filter.disconnect();
    });
}

async function mainFrameFilter(
    details: browser.webRequest._OnBeforeRequestDetails,
    buf: string,
    settings: Settings,
) {
    const parser = new DOMParser();
    const html = parser.parseFromString(buf, "text/html");

    const meta = html.querySelector("meta[name='server-response']");
    const content = meta?.getAttribute("content") as string;
    const mainData = JSON.parse(content) as MainData;

    await mainDataFilter(mainData, details, settings, meta);

    return `<!DOCTYPE html>${html.documentElement.outerHTML}`;
}

async function xhrFilter(
    details: browser.webRequest._OnBeforeRequestDetails,
    buf: string,
    settings: Settings,
) {
    const mainData = JSON.parse(buf) as MainData;
    await mainDataFilter(mainData, details, settings);

    return JSON.stringify(mainData);
}

async function mainDataFilter(
    mainData: MainData,
    details: browser.webRequest._OnBeforeRequestDetails,
    settings: Settings,
    meta?: Element | null,
) {
    const response = mainData.data.response;
    const metadata = mainData.data.metadata;

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

                meta?.setAttribute("content", JSON.stringify(mainData));
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

    await setLog(
        {
            series: seriesData,
            videoId,
            title,
            userId,
            userName,
            tags,
        },
        details.tabId,
    );
}
