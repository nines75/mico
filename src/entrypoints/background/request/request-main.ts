import { NiconicoVideo } from "@/types/api/recommend.types.js";
import { isNgVideo } from "../video-filter/filter-video.js";
import { loadSettings, setLog } from "@/utils/storage.js";
import { Settings } from "@/types/storage/settings.types.js";
import { SeriesData } from "@/types/storage/log.types.js";

interface MainData {
    data: {
        response: {
            series: {
                video: {
                    next: NiconicoVideo | null;
                };
            } | null;
            tag: {
                items: {
                    name: string;
                }[];
            } | null;
            video: {
                id: string;
            } | null;
        };
    };
}

export function mainRequest(
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
    const seriesData: SeriesData = (() => {
        const series = mainData.data.response.series?.video;
        const video = series?.next;

        if (series !== undefined && video !== null && video !== undefined) {
            if (isNgVideo(video, settings)) {
                series.next = null;
                meta?.setAttribute("content", JSON.stringify(mainData));
            }

            return { hasNext: true, data: video };
        } else {
            return { hasNext: false };
        }
    })();
    const tags =
        mainData.data.response.tag?.items.map((data) => data.name) ?? [];
    const videoId = mainData.data.response.video?.id ?? null;

    await setLog({ series: seriesData, tags, videoId }, details.tabId);
}
