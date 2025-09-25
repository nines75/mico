import { fakeBrowser } from "#imports";
import { beforeEach, describe, expect, it } from "vitest";
import {
    countCommonLog,
    escapeNewline,
    isNiconicoPage,
    isRankingPage,
    isSearchPage,
    isWatchPage,
    pushCommonLog,
} from "./util.js";
import { CommonLog } from "@/types/storage/log.types.js";

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
        { url: "https://www.nicovideo.jp/watch/sm1234", expected: true },
        { url: "https://www.nicovideo.jp/watch/1234", expected: true }, // https://github.com/nines75/mico/issues/13
        { url: "https://www.nicovideo.jp/", expected: false },
        { expected: false },
    ])(`${isWatchPage.name}($url)`, ({ url, expected }) => {
        expect(isWatchPage(url)).toBe(expected);
    });

    it.each([
        { url: "https://www.nicovideo.jp/ranking/genre", expected: true },
        {
            url: "https://www.nicovideo.jp/ranking/genre/e9uj2uks",
            expected: true,
        },
        { url: "https://www.nicovideo.jp/ranking/for_you", expected: false },
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

    it(`${countCommonLog.name}()`, () => {
        const log = new Map([
            ["a", ["1", "2"]],
            ["b", ["3"]],
        ]) satisfies CommonLog;

        expect(countCommonLog(log)).toEqual(3);
    });

    it.each([
        {
            name: "存在しないキー",
            log: new Map(),
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
});
