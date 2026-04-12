import { describe, expect, it } from "vitest";
import {
    customMerge,
    escapeNewline,
    isNiconicoPage,
    isRankingPage,
    isSearchPage,
    isWatchPage,
    replace,
    sumNumbers,
} from "./util";

describe(isNiconicoPage.name, () => {
    it.each([
        { url: "https://www.nicovideo.jp/", expected: true },
        { url: "https://www.nicovideo.jp/ranking/genre", expected: true },
        { url: "https://live.nicovideo.jp/", expected: false },
        { expected: false },
    ])(`$url`, ({ url, expected }) => {
        expect(isNiconicoPage(url)).toBe(expected);
    });
});

describe(isWatchPage.name, () => {
    it.each([
        { url: "https://www.nicovideo.jp/watch/sm0", expected: true },
        { url: "https://www.nicovideo.jp/watch/0", expected: true }, // https://github.com/nines75/mico/issues/13
        { url: "https://www.nicovideo.jp/", expected: false },
        { expected: false },
    ])(`$url`, ({ url, expected }) => {
        expect(isWatchPage(url)).toBe(expected);
    });
});

describe(isRankingPage.name, () => {
    it.each([
        { url: "https://www.nicovideo.jp/ranking", expected: true }, // https://github.com/nines75/mico/issues/39
        { url: "https://www.nicovideo.jp/ranking/genre", expected: true },
        {
            url: "https://www.nicovideo.jp/ranking/genre/e9uj2uks",
            expected: true,
        },
        { url: "https://www.nicovideo.jp/ranking/custom", expected: false },
        { url: "https://www.nicovideo.jp/", expected: false },
        { expected: false },
    ])(`$url`, ({ url, expected }) => {
        expect(isRankingPage(url)).toBe(expected);
    });
});

describe(isSearchPage.name, () => {
    it.each([
        { url: "https://www.nicovideo.jp/search/test", expected: true },
        { url: "https://www.nicovideo.jp/tag/test", expected: true },
        { url: "https://www.nicovideo.jp/series_search/test", expected: false },
        { url: "https://www.nicovideo.jp/mylist_search/test", expected: false },
        { url: "https://www.nicovideo.jp/user_search/test", expected: false },
        { url: "https://www.nicovideo.jp/", expected: false },
        { expected: false },
    ])(`$url`, ({ url, expected }) => {
        expect(isSearchPage(url)).toBe(expected);
    });
});

it(escapeNewline.name, () => {
    expect(escapeNewline("hello\nworld\n\n!")).toBe(
        String.raw`hello\nworld\n\n!`,
    );
});

describe(sumNumbers.name, () => {
    it.each([
        {
            name: "基本",
            numbers: [1, 2, 3],
            expected: 6,
        },
        {
            name: "空配列",
            numbers: [],
            expected: 0,
        },
    ] satisfies { name: string; numbers: number[]; expected: number }[])(
        `$name`,
        ({ numbers, expected }) => {
            expect(sumNumbers(numbers)).toEqual(expected);
        },
    );
});

describe(replace.name, () => {
    it.each([
        {
            name: "単数",
            text: "$1",
            placeholders: ["test"],
            expected: "test",
        },
        {
            name: "複数",
            text: "$1 $2",
            placeholders: ["test", "string"],
            expected: "test string",
        },
    ] satisfies {
        name: string;
        text: string;
        placeholders: string[];
        expected: string;
    }[])(`$name`, ({ text, placeholders, expected }) => {
        expect(replace(text, placeholders)).toEqual(expected);
    });
});

it("customMerge", () => {
    const oldObject = {
        nest: {
            a: true,
        },
        array: [1],
        map: new Map([["a", 1]]),
        set: new Set([1]),
        undefined: true,
    };
    const newObject = {
        nest: {
            b: false,
        },
        array: [2],
        map: new Map([["b", 2]]),
        set: new Set([2]),
        undefined: undefined,
    };

    expect(customMerge(oldObject, newObject)).toStrictEqual({
        nest: {
            a: true,
            b: false,
        },
        array: [2],
        map: new Map([["b", 2]]),
        set: new Set([2]),
        undefined: undefined,
    });
});
