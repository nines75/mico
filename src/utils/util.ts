// -------------------------------------------------------------------------------------------
// このファイルにはユーティリティ関数のうち純粋関数のみを定義する
// そのほかのユーティリティ関数は循環参照を避けるためにファイルを分割して定義する
// -------------------------------------------------------------------------------------------

import type { DeepMergeLeafURI, DeepMergeNoFilteringURI } from "deepmerge-ts";
import { deepmergeCustom } from "deepmerge-ts";
import type { z } from "./zod";
import baseDecamelize from "decamelize";

export function isNiconicoPage(url: string | undefined) {
  if (url === undefined) return false;

  return url.startsWith("https://www.nicovideo.jp/");
}

export function isWatchPage(url: string | undefined) {
  if (url === undefined) return false;

  return url.startsWith("https://www.nicovideo.jp/watch/");
}

export function isRankingPage(url: string | undefined) {
  if (url === undefined) return false;

  return (
    url.startsWith("https://www.nicovideo.jp/ranking") &&
    !url.startsWith("https://www.nicovideo.jp/ranking/custom")
  );
}

export function isSearchPage(url: string | undefined) {
  if (url === undefined) return false;

  return (
    url.startsWith("https://www.nicovideo.jp/search/") ||
    url.startsWith("https://www.nicovideo.jp/search_shorts/") ||
    url.startsWith("https://www.nicovideo.jp/tag/") ||
    url.startsWith("https://www.nicovideo.jp/tag_shorts/")
  );
}

export function escapeNewline(text: string) {
  return text.replaceAll("\n", String.raw`\n`);
}

export function sum(numbers: number[]) {
  return numbers.reduce((result, num) => result + num, 0);
}

export function catchAsync<T extends unknown[]>(
  fn: (...args: T) => Promise<void>,
) {
  return (...args: T): void => {
    fn(...args).catch(console.error);
  };
}

export function isString(value: unknown) {
  return typeof value === "string";
}

export const merge = deepmergeCustom<
  unknown,
  {
    DeepMergeArraysURI: DeepMergeLeafURI;
    DeepMergeMapsURI: DeepMergeLeafURI;
    DeepMergeSetsURI: DeepMergeLeafURI;
    DeepMergeFilterValuesURI: DeepMergeNoFilteringURI;
  }
>({
  // マージではなく上書きする
  mergeArrays: false,
  mergeMaps: false,
  mergeSets: false,

  // 値がundefinedでも上書きする
  filterValues: false,
});

export function safeParseJson<T>(
  text: string | null | undefined,
  schema: z.ZodType<T>,
): T | undefined {
  try {
    if (text === null || text === undefined) return;

    const data = JSON.parse(text) as unknown;
    const result = schema.safeParse(data);

    return result.success ? result.data : undefined;
  } catch {
    return;
  }
}

export function decamelize(text: string) {
  return baseDecamelize(text, { separator: "-" });
}
