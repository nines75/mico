import { fakeBrowser } from "#imports";
import { beforeEach, describe, expect, it } from "vitest";
import { escapeNewline, isWatchPage, savePlaybackTime } from "./util.js";
import { getLogData } from "./storage.js";

describe("util", () => {
    beforeEach(() => {
        fakeBrowser.reset();
    });

    it(`${isWatchPage.name}()`, () => {
        [
            {
                url: "https://www.nicovideo.jp/watch/sm1234",
                expected: true,
            },
            // https://github.com/nines75/mico/issues/13
            {
                url: "https://www.nicovideo.jp/watch/1234",
                expected: true,
            },
            {
                url: "https://www.nicovideo.jp/",
                expected: false,
            },
            {
                url: undefined,
                expected: false,
            },
        ].forEach(({ url, expected }) => {
            expect(isWatchPage(url)).toBe(expected);
        });
    });

    it(`${escapeNewline.name}()`, () => {
        expect(escapeNewline("hello\nworld\n\n!")).toBe("hello\\nworld\\n\\n!");
    });

    it(`${savePlaybackTime.name}()`, async () => {
        await savePlaybackTime(1, 100);

        expect(await getLogData(1)).toEqual({ playbackTime: 100 });
    });
});
