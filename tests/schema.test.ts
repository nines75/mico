import { safeParseJson } from "@/utils/util";
import { commentApiSchema } from "@/types/api/comment-api.types";
import { searchPlaylistApiSchema } from "@/types/api/search-playlist-api.types";
import { rankingApiSchema } from "@/types/api/ranking-api.types";
import { recommendApiSchema } from "@/types/api/recommend-api.types";
import { searchApiSchema } from "@/types/api/search-api.types";
import { watchApiSchema } from "@/types/api/watch-api.types";
import type { z } from "@/utils/zod";
import { test, expect } from "@playwright/test";

const WATCH_PAGE_URL = "https://www.nicovideo.jp/watch/sm9";
const CHANNEL_WATCH_PAGE_URL = "https://www.nicovideo.jp/watch/so15013657"; // 海外からのアクセスでも視聴可能なチャンネル動画
const RANKING_PAGE_URL = "https://www.nicovideo.jp/ranking/genre/";
const SEARCH_PAGE_URL = "https://www.nicovideo.jp/search/%E6%96%99%E7%90%86";
const TAG_SEARCH_PAGE_URL = "https://www.nicovideo.jp/tag/%E6%96%99%E7%90%86";

for (const { title, url, responseUrl, method, schema, selector } of [
  {
    title: "CommentApi",
    url: WATCH_PAGE_URL,
    responseUrl: "https://public.nvcomment.nicovideo.jp/v1/threads",
    method: "POST",
    schema: commentApiSchema,
  },
  {
    title: "RecommendApi",
    url: WATCH_PAGE_URL,
    responseUrl:
      "https://nvapi.nicovideo.jp/v1/recommend?recipeId=video_watch_recommendation",
    method: "GET",
    schema: recommendApiSchema,
  },
  {
    title: "RecommendApi(チャンネル動画)",
    url: CHANNEL_WATCH_PAGE_URL,
    responseUrl:
      "https://nvapi.nicovideo.jp/v1/recommend?recipeId=video_channel_watch_recommendation",
    method: "GET",
    schema: recommendApiSchema,
  },
  {
    title: "SearchPlaylistApi",
    url: SEARCH_PAGE_URL,
    responseUrl: "https://nvapi.nicovideo.jp/v1/playlist/search",
    method: "GET",
    schema: searchPlaylistApiSchema,
    selector: "[data-anchor-area='main'][tabindex]",
  },
] satisfies {
  title: string;
  url: string;
  responseUrl: string;
  method: "GET" | "POST";
  schema: z.ZodType;
  selector?: string;
}[]) {
  test(title, async ({ page }) => {
    await page.goto(url);

    if (selector !== undefined) {
      await page.locator(selector).first().click();
    }

    const response = await page.waitForResponse(
      (data) =>
        data.url().startsWith(responseUrl) &&
        data.request().method() === method,
    );
    const text = await response.text();

    expect(safeParseJson(text, schema as z.ZodType)).not.toBeUndefined();
  });
}

for (const { title, url, schema } of [
  {
    title: "WatchApi",
    url: WATCH_PAGE_URL,
    schema: watchApiSchema,
  },
  {
    title: "RankingApi",
    url: RANKING_PAGE_URL,
    schema: rankingApiSchema,
  },
  {
    title: "SearchApi",
    url: SEARCH_PAGE_URL,
    schema: searchApiSchema,
  },
  {
    title: "SearchApi(タグ)",
    url: TAG_SEARCH_PAGE_URL,
    schema: searchApiSchema,
  },
] satisfies {
  title: string;
  url: string;
  schema: z.ZodType;
}[]) {
  test(title, async ({ page }) => {
    const response = await page.goto(url);
    const text = await response?.text();
    if (text === undefined) throw new Error("レスポンスが取得できませんでした");

    const content = await page.evaluate((str) => {
      const parser = new DOMParser();
      const html = parser.parseFromString(str, "text/html");

      const meta = html.querySelector("meta[name='server-response']");
      return meta?.getAttribute("content");
    }, text);

    expect(safeParseJson(content, schema)).not.toBeUndefined();
  });
}
