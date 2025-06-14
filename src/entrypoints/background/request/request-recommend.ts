import { RecommendDataContainer } from "@/types/api/recommend.types.js";

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

    filter.onstop = () => {
        try {
            const recommendData = JSON.parse(buf) as RecommendDataContainer;

            filter.write(encoder.encode(JSON.stringify(recommendData)));
            filter.disconnect();
        } catch (e) {
            console.error(e);
        }
    };
}
