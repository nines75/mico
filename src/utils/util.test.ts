import { fakeBrowser } from "#imports";
import { beforeEach, describe, expect, it } from "vitest";
import { escapeNewline, extractVideoId, savePlaybackTime } from "./util.js";
import { getLogData } from "./storage.js";

describe("util", () => {
    beforeEach(() => {
        fakeBrowser.reset();
    });

    it(`${extractVideoId.name}()`, () => {
        [
            ["https://www.nicovideo.jp/watch/sm1234", "sm1234"],
            ["https://www.nicovideo.jp/watch/so1234", "so1234"],
            ["https://www.nicovideo.jp/watch/nl1234", "nl1234"],
            ["https://www.nicovideo.jp/watch/nm1234", "nm1234"],
        ].forEach(([url, videoId]) => {
            expect(extractVideoId(url)).toBe(videoId);
        });

        ["https://www.nicovideo.jp/watch/ab1234", "undefined"].forEach(
            (url) => {
                expect(extractVideoId(url)).toBe(undefined);
            },
        );
    });

    it(`${escapeNewline.name}()`, () => {
        expect(escapeNewline("hello\nworld\n\n!")).toBe("hello\\nworld\\n\\n!");
    });

    it(`${savePlaybackTime.name}()`, async () => {
        await savePlaybackTime(1, 100);

        expect(await getLogData(1)).toEqual({ playbackTime: 100 });
    });
});
