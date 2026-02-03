import type { DeepMergeLeafURI, DeepMergeNoFilteringURI } from "deepmerge-ts";
import { deepmergeCustom } from "deepmerge-ts";
import type { CommonLog } from "../types/storage/log.types";
import type { z } from "./zod";

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
        url.startsWith("https://www.nicovideo.jp/tag/")
    );
}

export function escapeNewline(str: string) {
    return str.replaceAll("\n", String.raw`\n`);
}

export function pushCommonLog(log: CommonLog, key: string, value: string) {
    const array = log.get(key);
    if (array === undefined) {
        log.set(key, [value]);
    } else {
        array.push(value);
    }
}

export function sumNumbers(numbers: number[]) {
    return numbers.reduce((sum, num) => sum + num, 0);
}

export function replace(text: string, placeholders: string[]) {
    let result = text;
    for (const [index, placeholder] of placeholders.entries()) {
        result = result.replace(`$${index + 1}`, placeholder);
    }

    return result;
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

export const customMerge = deepmergeCustom<
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

        const data = JSON.parse(text) as string;
        const result = schema.safeParse(data);

        return result.success ? result.data : undefined;
    } catch {
        return;
    }
}
