import { describe, expect, it } from "vitest";
import { sortCommentId } from "./filter";
import { testComments } from "@/utils/test";

describe(`${sortCommentId.name}()`, () => {
    const ids = ["1000", "1001", "1002", "1003", "1004", "1005", "1006"];

    it("default", () => {
        expect(sortCommentId(ids, testComments)).toEqual([
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
        expect(sortCommentId(ids, testComments, true)).toEqual([
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
