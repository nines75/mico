import { RecommendDataContainer } from "@/types/api/recommend.types.js";
import { getLogData, loadSettings, setLog } from "@/utils/storage.js";
import { filterVideo } from "../video-filter/filter-video.js";
import { saveLog } from "../video-filter/save-log.js";

export function recommendRequest(
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
            const [settings, log] = await Promise.all([
                loadSettings(),
                getLogData(details.tabId),
            ]);
            const recommendData = JSON.parse(buf) as RecommendDataContainer;
            const tabId = details.tabId;

            const filteredData = filterVideo(recommendData.data, settings, log);

            filter.write(encoder.encode(JSON.stringify(recommendData)));
            filter.disconnect();

            if (filteredData === undefined) return;

            const tasks: Promise<void>[] = [];

            tasks.push(saveLog(filteredData, tabId));
            tasks.push(
                setLog(
                    {
                        videoFilterLog: {
                            processingTime: {
                                filtering: filteredData.filteringTime,
                            },
                        },
                    },
                    tabId,
                ),
            );

            await Promise.all(tasks);
        } catch (e) {
            console.error(e);
        }
    };
}
