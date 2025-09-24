import { loadSettings } from "@/utils/storage.js";
import { Settings } from "@/types/storage/settings.types.js";
import { filterVideo } from "../video-filter/filter-video.js";
import { saveLog } from "../video-filter/save-log.js";
import { filterResponse } from "./request.js";
import { RankingData } from "@/types/api/ranking.types.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import { cleanupStorage } from "@/utils/storage-write.js";

export function rankingRequest(
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

        await cleanupStorage();
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
    const rankingData = JSON.parse(content) as RankingData;

    await rankingDataFilter(rankingData, details, settings, meta);

    return `<!DOCTYPE html>${html.documentElement.outerHTML}`;
}

async function xhrFilter(
    details: browser.webRequest._OnBeforeRequestDetails,
    buf: string,
    settings: Settings,
) {
    const rankingData = JSON.parse(buf) as RankingData;
    await rankingDataFilter(rankingData, details, settings);

    return JSON.stringify(rankingData);
}

async function rankingDataFilter(
    rankingData: RankingData,
    details: browser.webRequest._OnBeforeRequestDetails,
    settings: Settings,
    meta?: Element | null,
) {
    const videos = rankingData.data.response.$getTeibanRanking.data.items;
    const filteredData = filterVideo(videos, settings);
    if (filteredData === undefined) return;

    const spoofedVideos = videos.map(
        (video): NiconicoVideo => ({
            ...video,
            ...(filteredData.filteredIds.has(video.id)
                ? { id: "dummy-id" }
                : {}),
        }),
    );

    rankingData.data.response.$getTeibanRanking.data.items = spoofedVideos;
    meta?.setAttribute("content", JSON.stringify(rankingData));

    await saveLog(filteredData, details.tabId, true);
}
