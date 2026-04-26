import { printInvalidRule } from "@/utils/util";
import { createDefaultToggle, type Rule } from "./rule";
import type { Settings } from "@/types/storage/settings.types";
import type { Except } from "type-fest";

export type Directive =
    | {
          type:
              | "include-tags"
              | "include-video-ids"
              | "include-user-ids"
              | "include-series-ids"
              | "exclude-tags"
              | "exclude-video-ids"
              | "exclude-user-ids"
              | "exclude-series-ids";
          args: string[];
      }
    | {
          type:
              | "strict"
              | "disable"
              | "comment-user-id"
              | "comment-commands"
              | "comment-body"
              | "video-id"
              | "video-owner-id"
              | "video-owner-name"
              | "video-title";
      };

export const argsDirectives = [
    "include-tags",
    "include-video-ids",
    "include-user-ids",
    "include-series-ids",
    "exclude-tags",
    "exclude-video-ids",
    "exclude-user-ids",
    "exclude-series-ids",
] as const satisfies Extract<Directive, { args: string[] }>["type"][];

export const noArgsDirectives = [
    "strict",
    "disable",
    "comment-user-id",
    "comment-commands",
    "comment-body",
    "video-id",
    "video-owner-id",
    "video-owner-name",
    "video-title",
] as const satisfies Exclude<Directive, { args: string[] }>["type"][];

export function parseFilter(
    settings: Settings,
    includeIndex = false, // テストが複雑になるためindexはデフォルトで含めない
): {
    rules: Rule[];
    invalidCount: number;
} {
    let invalidCount = 0;
    let strictAlias = false;
    const directives: Directive[] = [];
    const rules: Rule[] = [];

    const lines = settings.manualFilter
        .split("\n")
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line !== "" && !line.startsWith("#"));

    lineLoop: for (const { line, index } of lines) {
        // -------------------------------------------------------------------------------------------
        // ディレクティブのパース
        // -------------------------------------------------------------------------------------------
        const trimmedLine = line.trimEnd();

        // 引数あり
        for (const directive of argsDirectives) {
            if (new RegExp(String.raw`^@${directive}\s`).test(line)) {
                directives.push({
                    type: directive,
                    args: parseArgs(line),
                });
                continue lineLoop;
            }
        }

        // 引数なし
        for (const directive of noArgsDirectives) {
            if (trimmedLine === `@${directive}`) {
                directives.push({ type: directive });
                continue lineLoop;
            }
        }
        if (trimmedLine === "@end") {
            directives.pop();
            continue;
        }
        if (trimmedLine === "@s") {
            strictAlias = true;
            continue;
        }

        // 有効なディレクティブでなくても@から始まる行はルールとして解釈しない
        if (line.startsWith("@")) continue;

        // -------------------------------------------------------------------------------------------
        // ルールに適用するディレクティブを決定
        // -------------------------------------------------------------------------------------------

        const rule: Except<Rule, "pattern"> = {
            strict: false,
            disable: false,
            include: createDefaultToggle(),
            exclude: createDefaultToggle(),
            target: {
                commentUserId: false,
                commentCommands: false,
                commentBody: false,
                videoId: false,
                videoOwnerId: false,
                videoOwnerName: false,
                videoTitle: false,
            },
        };

        for (const directive of directives) {
            switch (directive.type) {
                // 引数あり(include)
                case "include-tags": {
                    pushArgs(rule.include.tags, directive);
                    break;
                }
                case "include-video-ids": {
                    pushArgs(rule.include.videoIds, directive);
                    break;
                }
                case "include-user-ids": {
                    pushArgs(rule.include.userIds, directive);
                    break;
                }
                case "include-series-ids": {
                    pushArgs(rule.include.seriesIds, directive);
                    break;
                }

                // 引数あり(exclude)
                case "exclude-tags": {
                    pushArgs(rule.exclude.tags, directive);
                    break;
                }
                case "exclude-video-ids": {
                    pushArgs(rule.exclude.videoIds, directive);
                    break;
                }
                case "exclude-user-ids": {
                    pushArgs(rule.exclude.userIds, directive);
                    break;
                }
                case "exclude-series-ids": {
                    pushArgs(rule.exclude.seriesIds, directive);
                    break;
                }

                // 引数なし
                case "strict": {
                    rule.strict = true;
                    break;
                }
                case "disable": {
                    rule.disable = true;
                    break;
                }

                // 引数なし(target)
                case "comment-user-id": {
                    rule.target.commentUserId = true;
                    break;
                }
                case "comment-commands": {
                    rule.target.commentCommands = true;
                    break;
                }
                case "comment-body": {
                    rule.target.commentBody = true;
                    break;
                }
                case "video-id": {
                    rule.target.videoId = true;
                    break;
                }
                case "video-owner-id": {
                    rule.target.videoOwnerId = true;
                    break;
                }
                case "video-owner-name": {
                    rule.target.videoOwnerName = true;
                    break;
                }
                case "video-title": {
                    rule.target.videoTitle = true;
                    break;
                }
            }
        }

        // エイリアスの適用
        if (strictAlias) {
            rule.strict = true;
            strictAlias = false;
        }

        // -------------------------------------------------------------------------------------------
        // ルールのパース
        // -------------------------------------------------------------------------------------------

        const results = /^\/(.*)\/(.*)$/.exec(line);

        const regexStr = results?.[1];
        const flags = results?.[2];

        let regex: RegExp | undefined;
        if (regexStr !== undefined && flags !== undefined) {
            // 想定外のフラグが含まれている場合はルールとして解釈しない
            if (!/^[isuvm]*$/.test(flags)) {
                invalidCount++;
                printInvalidRule(line);
                continue;
            }

            try {
                regex = new RegExp(regexStr, flags);
            } catch {
                invalidCount++;
                printInvalidRule(line);
                continue;
            }
        }

        rules.push({
            pattern: regex ?? line,
            ...rule,
            ...(includeIndex ? { index } : {}),
        });
    }

    return { rules, invalidCount };
}

export function parseArgs(line: string) {
    return line
        .split(/\s+/)
        .slice(1)
        .filter((arg) => arg !== "")
        .map((arg) => arg.toLowerCase());
}

function pushArgs(array: string[][], directive: { args: string[] }) {
    const args = directive.args;
    if (args.length > 0) array.push(args);
}
