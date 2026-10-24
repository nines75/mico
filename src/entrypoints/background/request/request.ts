import type { Settings } from "@/types/storage/settings.types";
import { catchAsync, safeParseJson } from "@/utils/util";
import type { z } from "@/utils/zod";

export function filterResponse(
  details: browser.webRequest._OnBeforeRequestDetails,
  method: "GET" | "POST",
  onStop: (
    filter: browser.webRequest.StreamFilter,
    encoder: TextEncoder,
    body: string,
  ) => Promise<boolean>,
) {
  if (details.method !== method) return;

  const filter = browser.webRequest.filterResponseData(details.requestId);
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();

  let body = "";
  filter.ondata = (event) => {
    body += decoder.decode(event.data, { stream: true });
  };

  filter.onstop = catchAsync(async () => {
    const shouldCancel = await onStop(filter, encoder, body);
    if (shouldCancel) {
      filter.write(encoder.encode(body));
      filter.disconnect();
    }
  });
}

export function spaFilter<T, U>(
  details: browser.webRequest._OnBeforeRequestDetails,
  body: string,
  settings: Settings,
  schema: z.ZodType<T>,
  filter: (data: T, settings: Settings) => U,
) {
  if (details.type === "main_frame") {
    const parser = new DOMParser();
    const html = parser.parseFromString(body, "text/html");

    const meta = html.querySelector("meta[name='server-response']");
    const content = meta?.getAttribute("content");
    const data = safeParseJson(content, schema);
    if (data === undefined) return;

    // filter()ではdataを変更するため先に呼び出す
    const filteringResult = filter(data, settings);
    meta?.setAttribute("content", JSON.stringify(data));

    return {
      filteredBody: `<!DOCTYPE html>${html.documentElement.outerHTML}`,
      filteringResult,
    };
  }

  if (details.type === "xmlhttprequest") {
    const data = safeParseJson(body, schema);
    if (data === undefined) return;

    // filter()ではdataを変更するため先に呼び出す
    const filteringResult = filter(data, settings);

    return {
      filteredBody: JSON.stringify(data),
      filteringResult,
    };
  }
}
