import { fakeBrowser } from "#imports";
import { beforeEach, describe, expect, it } from "vitest";
import {
    escapeNewline,
    extractVideoId,
    savePlaybackTime,
    saveProcessingTime,
} from "./util.js";
import { getLogData } from "./storage.js";

describe("util", () => {
    beforeEach(() => {
        fakeBrowser.reset();
    });

    it("extractVideoId()", () => {
        [
            ["https://www.nicovideo.jp/watch/sm1234", "sm1234"],
            ["https://www.nicovideo.jp/watch/so1234", "so1234"],
            ["https://www.nicovideo.jp/watch/nl1234", "nl1234"],
            ["https://www.nicovideo.jp/watch/nm1234", "nm1234"],
        ].forEach(([url, videoId]) => {
            expect(extractVideoId(url)).toBe(videoId);
        });
    });

    it("escapeNewline()", () => {
        expect(escapeNewline("hello\nworld\n\n!")).toBe("hello\\nworld\\n\\n!");
    });

    it("savePlaybackTime()", async () => {
        await savePlaybackTime(1, 100);

        expect(await getLogData(1)).toEqual({ playbackTime: 100 });
    });

    it("saveProcessingTime", async () => {
        await saveProcessingTime([], 1);
        expect(await getLogData(1)).toEqual(undefined);

        await saveProcessingTime(
            [
                ["filtering", 10],
                ["fetchTag", undefined],
            ],
            1,
        );
        expect(await getLogData(1)).toEqual({
            processingTime: {
                filtering: 10,
                fetchTag: -1,
            },
        });
    });
});
