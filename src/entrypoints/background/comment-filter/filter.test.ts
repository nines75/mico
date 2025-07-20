import { describe, expect, it } from "vitest";
import { sortCommentId } from "./filter.js";
import { testCommentData } from "@/utils/test.js";

describe(`${sortCommentId.name}()`, () => {
    const ids = ["1000", "1001", "1002", "1003", "1004", "1005", "1006"];

    it("default", () => {
        expect(sortCommentId(ids, testCommentData)).toEqual([
            "1005",
            "1000",
            "1001",
            "1006",
            "1004",
            "1002",
            "1003",
        ]);
    });

    it("スコアでソート", () => {
        expect(sortCommentId(ids, testCommentData, true)).toEqual([
            "1002",
            "1003",
            "1004",
            "1005",
            "1000",
            "1001",
            "1006",
        ]);
    });
});
