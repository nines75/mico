import type { Settings } from "./settings.types";
import { parseFilter } from "@/entrypoints/background/parse-filter";

export function migrateSettingsToV3(v2: Partial<Settings>) {
    const v3 = {
        ngUserId: migrateFilter(v2.ngUserId ?? "", [
            migrateMiddleComment,
            migrateVideoSpecificRule,
        ]),
        ngCommand: migrateAllRule(
            migrateFilter(v2.ngCommand ?? "", [
                migrateMiddleComment,
                migrateStrictAlias,
                migrateToggleByTags,
            ]),
        ),
        ngWord: migrateFilter(v2.ngWord ?? "", [
            migrateMiddleComment,
            migrateStrictAlias,
            migrateToggleByTags,
        ]),
        ngId: migrateFilter(v2.ngId ?? "", [migrateMiddleComment]),
        ngUserName: migrateFilter(v2.ngUserName ?? "", [migrateMiddleComment]),
        ngTitle: migrateFilter(v2.ngTitle ?? "", [migrateMiddleComment]),
    } satisfies Partial<Settings>;

    return { ...v2, ...v3 };
}

function migrateFilter(
    filter: string,
    lineEditors: ((line: string) => string)[],
) {
    let result = filter;
    for (const lineEditor of lineEditors) {
        result = result
            .split("\n")
            .map((line) => {
                if (line.startsWith("#")) return line;
                return lineEditor(line);
            })
            .join("\n");
    }

    return result;
}

// -------------------------------------------------------------------------------------------
// 行の移行関数
// -------------------------------------------------------------------------------------------

function migrateVideoSpecificRule(line: string) {
    const result = /^(.+)@(.+)$/.exec(line);
    const videoId = result?.[1];
    const rule = result?.[2];

    return videoId !== undefined && rule !== undefined
        ? `@v ${videoId}\n${rule}`
        : line;
}

function migrateStrictAlias(line: string) {
    const result = /^!(.+)$/.exec(line);
    const rule = result?.[1];

    return rule === undefined ? line : `@s\n${rule}`;
}

function migrateMiddleComment(line: string) {
    const result = /^(.*?)\s*((?<!\\)#.*)$/.exec(line);
    const rule = result?.[1];
    const comment = result?.[2];

    return rule !== undefined && comment !== undefined
        ? `${comment}\n${rule}`
        : line;
}

function migrateToggleByTags(line: string) {
    const result = /^@(include|exclude)( .*)$/.exec(line);
    const directive = result?.[1];
    const args = result?.[2];

    return directive !== undefined && args !== undefined
        ? `@${directive}-tags${args}`
        : line;
}

// -------------------------------------------------------------------------------------------
// フィルターの移行関数
// -------------------------------------------------------------------------------------------

function migrateAllRule(filter: string) {
    // 無効化ルールであるか判定する必要があるのでparseが必要
    const allRuleLines = new Set(
        parseFilter(filter, true)
            .rules.filter(({ rule, isDisable }) => rule === "all" && isDisable)
            .map(({ index }) => index as number),
    );

    return filter
        .split("\n")
        .map((line, index) =>
            allRuleLines.has(index)
                ? "//" // 空文字列の正規表現
                : line,
        )
        .join("\n");
}
