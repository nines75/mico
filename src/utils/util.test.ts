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
  it.each([
    { url: "https://www.nicovideo.jp/" },
    { url: "https://www.nicovideo.jp/ranking/genre" },
    { url: "https://live.nicovideo.jp/", expected: false },
    { expected: false },
  ])(`$url`, ({ url, expected }) => {
    expect(isNiconicoPage(url)).toBe(expected ?? true);
  });
});

describe(isWatchPage.name, () => {
  it.each([
    { url: "https://www.nicovideo.jp/watch/sm0" },
    { url: "https://www.nicovideo.jp/watch/0" }, // https://github.com/nines75/mico/issues/13
    { url: "https://www.nicovideo.jp/", expected: false },
    { expected: false },
  ])(`$url`, ({ url, expected }) => {
    expect(isWatchPage(url)).toBe(expected ?? true);
  });
});

describe(isRankingPage.name, () => {
  it.each([
    { url: "https://www.nicovideo.jp/ranking" }, // https://github.com/nines75/mico/issues/39
    { url: "https://www.nicovideo.jp/ranking/genre" },
    { url: "https://www.nicovideo.jp/ranking/genre/e9uj2uks" },
    { url: "https://www.nicovideo.jp/ranking/custom", expected: false },
    { url: "https://www.nicovideo.jp/", expected: false },
    { expected: false },
  ])(`$url`, ({ url, expected }) => {
    expect(isRankingPage(url)).toBe(expected ?? true);
  });
});

describe(isSearchPage.name, () => {
  it.each([
    { url: "https://www.nicovideo.jp/search/test" },
    { url: "https://www.nicovideo.jp/tag/test" },
    { url: "https://www.nicovideo.jp/series_search/test", expected: false },
    { url: "https://www.nicovideo.jp/mylist_search/test", expected: false },
    { url: "https://www.nicovideo.jp/user_search/test", expected: false },
    { url: "https://www.nicovideo.jp/", expected: false },
    { expected: false },
  ])(`$url`, ({ url, expected }) => {
    expect(isSearchPage(url)).toBe(expected ?? true);
  });
});

it(escapeNewline.name, () => {
  expect(escapeNewline("hello\nworld\n\n!")).toBe(
    String.raw`hello\nworld\n\n!`,
  );
});

describe(sum.name, () => {
  it.each([
    {
      name: "0",
      numbers: [],
      expected: 0,
    },
    {
      name: "1",
      numbers: [1],
      expected: 1,
    },
    {
      name: "複数",
      numbers: [1, 2, 3],
      expected: 6,
    },
  ] satisfies { name: string; numbers: number[]; expected: number }[])(
    `要素数: $name`,
    ({ numbers, expected }) => {
      expect(sum(numbers)).toEqual(expected);
    },
  );
});

it("merge", () => {
  const oldObject = {
    nest: {
      a: true,
    },
    array: [1],
    map: new Map([["a", 1]]),
    set: new Set([1]),
    undefined: true,
    null: true,
  };
  const newObject = {
    nest: {
      b: false,
    },
    array: [2],
    map: new Map([["b", 2]]),
    set: new Set([2]),
    undefined: undefined,
    null: null,
  };

  expect(merge(oldObject, newObject)).toStrictEqual({
    nest: {
      a: true,
      b: false,
    },
    array: [2],
    map: new Map([["b", 2]]),
    set: new Set([2]),
    undefined: undefined,
    null: null,
  });
});
