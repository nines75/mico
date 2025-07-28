export function filterResponse(
    details: browser.webRequest._OnBeforeRequestDetails,
    method: "GET" | "POST",
    callback: (
        filter: browser.webRequest.StreamFilter,
        encoder: TextEncoder,
        buf: string,
    ) => Promise<void>,
) {
    if (details.method !== method) return;

    const filter = browser.webRequest.filterResponseData(details.requestId);
    const decoder = new TextDecoder("utf-8");
    const encoder = new TextEncoder();

    let buf = "";
    filter.ondata = (event) => {
        buf += decoder.decode(event.data, { stream: true });
    };

    filter.onstop = async () => {
        await callback(filter, encoder, buf);
    };
}
