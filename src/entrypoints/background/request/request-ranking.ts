import { loadSettings, setLog } from "@/utils/storage.js";
import { Settings } from "@/types/storage/settings.types.js";
import { NiconicoVideo } from "@/types/api/recommend.types.js";
import { filterVideo } from "../video-filter/filter-video.js";
import { saveLog } from "../video-filter/save-log.js";

interface RankingData {
    data: {
        response: {
            $getTeibanRanking: {
                data: {
                    items: NiconicoVideo[];
                };
            };
        };
    };
}

export function rankingRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    if (details.method !== "GET") return;

    const filter = browser.webRequest.filterResponseData(details.requestId);
    const decoder = new TextDecoder("utf-8");
    const encoder = new TextEncoder();

    let buf = "";
    filter.ondata = (event) => {
        buf += decoder.decode(event.data, { stream: true });
    };

    filter.onstop = async () => {
        try {
            const settings = await loadSettings();

            filter.write(
                encoder.encode(
                    details.type === "main_frame"
                        ? await mainFrameFilter(details, buf, settings)
                        : await xhrFilter(details, buf, settings),
                ),
            );
            filter.disconnect();
        } catch (e) {
            console.error(e);
        }
    };
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
            ...(filteredData.filteredIds.has(video.id) ? { id: "sm0" } : {}),
        }),
    );

    rankingData.data.response.$getTeibanRanking.data.items = spoofedVideos;
    meta?.setAttribute("content", JSON.stringify(rankingData));

    const tasks: Promise<void>[] = [];

    tasks.push(saveLog(filteredData, details.tabId));
    tasks.push(
        setLog(
            {
                videoFilterLog: {
                    processingTime: {
                        filtering: filteredData.filteringTime,
                    },
                },
            },
            details.tabId,
        ),
    );

    await Promise.all(tasks);
}
