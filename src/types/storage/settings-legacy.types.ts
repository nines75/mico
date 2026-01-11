import type { Settings } from "./settings.types";
import { customMerge } from "@/utils/util";
import { parseFilter } from "@/entrypoints/background/parse-filter";

export function migrateSettingsToV3(v2: Partial<Settings>) {
    const migrateFilter = (
        filter: string,
        lineEditors: ((line: string) => string)[],
    ) => {
        return lineEditors.reduce((result, lineEditor) => {
            return result
                .split("\n")
                .map((line) => {
                    if (line.startsWith("#")) return line;
                    return lineEditor(line);
                })
                .join("\n");
        }, filter);
    };

    // -------------------------------------------------------------------------------------------
    // 行の移行関数
    // -------------------------------------------------------------------------------------------

    const migrateVideoSpecificRule = (line: string) => {
        const result = /^(.+)@(.+)$/.exec(line);
        const videoId = result?.[1];
        const rule = result?.[2];

        if (videoId !== undefined && rule !== undefined) {
            return `@v ${videoId}\n${rule}`;
        } else {
            return line;
        }
    };
    const migrateStrictAlias = (line: string) => {
        const result = /^!(.+)$/.exec(line);
        const rule = result?.[1];

        if (rule !== undefined) {
            return `@s\n${rule}`;
        } else {
            return line;
        }
    };
    const migrateMiddleComment = (line: string) => {
        const result = /^(.*?)\s*((?<!\\)#.*)$/.exec(line);
        const rule = result?.[1];
        const comment = result?.[2];

        if (rule !== undefined && comment !== undefined) {
            return `${comment}\n${rule}`;
        } else {
            return line;
        }
    };
    const migrateToggleByTags = (line: string) => {
        const result = /^@(include|exclude)( .*)$/.exec(line);
        const directive = result?.[1];
        const args = result?.[2];

        if (directive !== undefined && args !== undefined) {
            return `@${directive}-tags${args}`;
        } else {
            return line;
        }
    };

    // -------------------------------------------------------------------------------------------
    // フィルターの移行関数
    // -------------------------------------------------------------------------------------------

    const migrateAllRule = (filter: string) => {
        // 無効化ルールであるか判定する必要があるのでparseが必要
        const allRuleLines = parseFilter(filter, true)
            .rules.filter(({ rule, isDisable }) => rule === "all" && isDisable)
            .map(({ index }) => index as number);

        return filter
            .split("\n")
            .map((line, index) =>
                allRuleLines.includes(index)
                    ? "//" // 空文字列の正規表現
                    : line,
            )
            .join("\n");
    };

    // -------------------------------------------------------------------------------------------

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

    return customMerge(v2 as unknown, v3);
}
