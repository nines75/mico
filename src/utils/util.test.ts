import { describe, expect, it } from "vitest";
import {
  merge,
  escapeNewline,
  isNiconicoPage,
  isRankingPage,
  isSearchPage,
  isWatchPage,
  sum,
} from "./util";

describe(isNiconicoPage.name, () => {
  describe("trueを返す場合", () => {
    it.each([
      "https://www.nicovideo.jp/",
      "https://www.nicovideo.jp/ranking/genre",
    ])("%s", (url) => {
      expect(isNiconicoPage(url)).toBe(true);
    });
  });

  describe("falseを返す場合", () => {
    it.each(["https://live.nicovideo.jp/", undefined])("%s", (url) => {
      expect(isNiconicoPage(url)).toBe(false);
    });
  });
});

describe(isWatchPage.name, () => {
  describe("trueを返す場合", () => {
    it.each([
      "https://www.nicovideo.jp/watch/sm0",
      "https://www.nicovideo.jp/watch/0", // https://github.com/nines75/mico/issues/13
    ])("%s", (url) => {
      expect(isWatchPage(url)).toBe(true);
    });
  });

  describe("falseを返す場合", () => {
    it.each(["https://www.nicovideo.jp/", undefined])("%s", (url) => {
      expect(isWatchPage(url)).toBe(false);
    });
  });
});

describe(isRankingPage.name, () => {
  describe("trueを返す場合", () => {
    it.each([
      "https://www.nicovideo.jp/ranking", // https://github.com/nines75/mico/issues/39
      "https://www.nicovideo.jp/ranking/genre",
      "https://www.nicovideo.jp/ranking/genre/e9uj2uks",
    ])("%s", (url) => {
      expect(isRankingPage(url)).toBe(true);
    });
  });

  describe("falseを返す場合", () => {
    it.each([
      "https://www.nicovideo.jp/ranking/custom",
      "https://www.nicovideo.jp/",
      undefined,
    ])("%s", (url) => {
      expect(isRankingPage(url)).toBe(false);
    });
  });
});

describe(isSearchPage.name, () => {
  describe("trueを返す場合", () => {
    it.each([
      "https://www.nicovideo.jp/search/foo",
      "https://www.nicovideo.jp/search_shorts/foo",
      "https://www.nicovideo.jp/tag/foo",
      "https://www.nicovideo.jp/tag_shorts/foo",
    ])("%s", (url) => {
      expect(isSearchPage(url)).toBe(true);
    });
  });

  describe("falseを返す場合", () => {
    it.each([
      "https://www.nicovideo.jp/series_search/foo",
      "https://www.nicovideo.jp/mylist_search/foo",
      "https://www.nicovideo.jp/user_search/foo",
      "https://www.nicovideo.jp/",
      undefined,
    ])("%s", (url) => {
      expect(isSearchPage(url)).toBe(false);
    });
  });
});

describe(escapeNewline.name, () => {
  it("改行コードを含む文字列を渡した場合、改行コードをエスケープする", () => {
    expect(escapeNewline("foo\nbar")).toBe(String.raw`foo\nbar`);
  });
});

describe(sum.name, () => {
  it.each([
    { numbers: [], expected: 0 },
    { numbers: [1], expected: 1 },
    { numbers: [1, 2, 3], expected: 6 },
  ] satisfies { numbers: number[]; expected: number }[])(
    `$numbersを渡した場合、$expectedを返す`,
    ({ numbers, expected }) => {
      expect(sum(numbers)).toEqual(expected);
    },
  );
});

it("merge", () => {
  const oldObject = {
    nest: { a: true },
    array: [1],
    map: new Map([["a", 1]]),
    set: new Set([1]),
    undefined: true,
    null: true,
  };
  const newObject = {
    nest: { b: false },
    array: [2],
    map: new Map([["b", 2]]),
    set: new Set([2]),
    undefined: undefined,
    null: null,
  };

  expect(merge(oldObject, newObject)).toStrictEqual({
    nest: { a: true, b: false },
    array: [2],
    map: new Map([["b", 2]]),
    set: new Set([2]),
    undefined: undefined,
    null: null,
  });
});
