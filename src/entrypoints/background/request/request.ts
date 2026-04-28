import type { Settings } from "@/types/storage/settings.types";
import { catchAsync, safeParseJson } from "@/utils/util";
import type { z } from "@/utils/zod";

export function filterResponse(
  details: browser.webRequest._OnBeforeRequestDetails,
  method: "GET" | "POST",
  callback: (
    filter: browser.webRequest.StreamFilter,
    encoder: TextEncoder,
    buf: string,
  ) => Promise<boolean>,
) {
  if (details.method !== method) return;

  const filter = browser.webRequest.filterResponseData(details.requestId);
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();

  let buf = "";
  filter.ondata = (event) => {
    buf += decoder.decode(event.data, { stream: true });
  };

  filter.onstop = catchAsync(async () => {
    const shouldCancel = await callback(filter, encoder, buf);
    if (shouldCancel) {
      filter.write(encoder.encode(buf));
      filter.disconnect();
    }
  });
}

export function spaFilter<T, U>(
  details: browser.webRequest._OnBeforeRequestDetails,
  buf: string,
  settings: Settings,
  schema: z.ZodType<T>,
  callback: (data: T, settings: Settings, meta?: Element | null) => U,
) {
  if (details.type === "main_frame") {
    const parser = new DOMParser();
    const html = parser.parseFromString(buf, "text/html");

    const meta = html.querySelector("meta[name='server-response']");
    const content = meta?.getAttribute("content");
    const data = safeParseJson(content, schema);
    if (data === undefined) return;

    // callbackではhtmlを変更するため先に呼び出す
    const filteringResult = callback(data, settings, meta);

    return {
      filteredBuf: `<!DOCTYPE html>${html.documentElement.outerHTML}`,
      filteringResult,
    };
  }

  if (details.type === "xmlhttprequest") {
    const data = safeParseJson(buf, schema);
    if (data === undefined) return;

    // callbackではdataを変更するため先に呼び出す
    const filteringResult = callback(data, settings);

    return {
      filteredBuf: JSON.stringify(data),
      filteringResult,
    };
  }
}
