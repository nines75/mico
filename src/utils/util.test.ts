import { fakeBrowser } from "#imports";
import { beforeEach, describe, expect, it } from "vitest";
import {
    customMerge,
    escapeNewline,
    isNiconicoPage,
    isRankingPage,
    isSearchPage,
    isWatchPage,
    pushCommonLog,
    replace,
    sumNumbers,
} from "./util.js";
import type { CommonLog } from "@/types/storage/log.types.js";

describe("util", () => {
    beforeEach(() => {
        fakeBrowser.reset();
    });

    it.each([
        { url: "https://www.nicovideo.jp/", expected: true },
        { url: "https://www.nicovideo.jp/ranking/genre", expected: true },
        { url: "https://live.nicovideo.jp/", expected: false },
        { expected: false },
    ])(`${isNiconicoPage.name}($url)`, ({ url, expected }) => {
        expect(isNiconicoPage(url)).toBe(expected);
    });

    it.each([
        { url: "https://www.nicovideo.jp/watch/sm0", expected: true },
        { url: "https://www.nicovideo.jp/watch/0", expected: true }, // https://github.com/nines75/mico/issues/13
        { url: "https://www.nicovideo.jp/", expected: false },
        { expected: false },
    ])(`${isWatchPage.name}($url)`, ({ url, expected }) => {
        expect(isWatchPage(url)).toBe(expected);
    });

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
    ])(`${isRankingPage.name}($url)`, ({ url, expected }) => {
        expect(isRankingPage(url)).toBe(expected);
    });

    it.each([
        { url: "https://www.nicovideo.jp/search/test", expected: true },
        { url: "https://www.nicovideo.jp/tag/test", expected: true },
        { url: "https://www.nicovideo.jp/series_search/test", expected: false },
        { url: "https://www.nicovideo.jp/mylist_search/test", expected: false },
        { url: "https://www.nicovideo.jp/user_search/test", expected: false },
        { url: "https://www.nicovideo.jp/", expected: false },
        { expected: false },
    ])(`${isSearchPage.name}($url)`, ({ url, expected }) => {
        expect(isSearchPage(url)).toBe(expected);
    });

    it(`${escapeNewline.name}()`, () => {
        expect(escapeNewline("hello\nworld\n\n!")).toBe("hello\\nworld\\n\\n!");
    });

    it.each([
        {
            name: "存在しないキー",
            log: new Map<string, string[]>(),
            expected: new Map([["a", ["1"]]]),
        },
        {
            name: "存在するキー",
            log: new Map([["a", ["0"]]]),
            expected: new Map([["a", ["0", "1"]]]),
        },
    ] satisfies { name: string; log: CommonLog; expected: CommonLog }[])(
        `${pushCommonLog.name}($name)`,
        ({ log, expected }) => {
            pushCommonLog(log, "a", "1");

            expect(log).toEqual(expected);
        },
    );

    it.each([
        {
            name: "一般",
            numbers: [1, 2, 3],
            expected: 6,
        },
        {
            name: "空の配列",
            numbers: [],
            expected: 0,
        },
    ] satisfies { name: string; numbers: number[]; expected: number }[])(
        `${sumNumbers.name}($name)`,
        ({ numbers, expected }) => {
            expect(sumNumbers(numbers)).toEqual(expected);
        },
    );

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
    }[])(`${replace.name}($name)`, ({ text, placeholders, expected }) => {
        expect(replace(text, placeholders)).toEqual(expected);
    });

    it("customMerge()", () => {
        const oldObj = {
            nest: {
                a: true,
            },
            array: [1],
            map: new Map([["a", 1]]),
            set: new Set([1]),
            undefined: true,
        };
        const newObj = {
            nest: {
                b: false,
            },
            array: [2],
            map: new Map([["b", 2]]),
            set: new Set([2]),
            undefined: undefined,
        };

        expect(customMerge(oldObj, newObj)).toStrictEqual({
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
});
