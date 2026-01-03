import { createDefaultToggle, type Rule } from "./rule.js";

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
          params: string[];
      }
    | {
          type: "strict" | "disable";
      };

export const paramDirectives = [
    "include-tags",
    "include-video-ids",
    "include-user-ids",
    "include-series-ids",
    "exclude-tags",
    "exclude-video-ids",
    "exclude-user-ids",
    "exclude-series-ids",
] as const satisfies Extract<Directive, { params: string[] }>["type"][];

export function parseFilter(
    filter: string,
    hasIndex = false,
): {
    rules: Rule[];
    invalidCount: number;
} {
    let invalidCount = 0;
    let isStrictAlias = false;
    let videoIdsAlias: string[] = [];
    const directives: Directive[] = [];
    const rules: Rule[] = [];

    const parseParams = (str: string) => {
        return str
            .split(" ")
            .filter((rule) => rule !== "")
            .slice(1)
            .map((rule) => rule.toLowerCase());
    };

    filter
        .split("\n")
        .map((line, index) => ({ rule: line, index }))
        .filter(({ rule }) => rule !== "" && !rule.startsWith("#"))
        .forEach(({ rule, index }) => {
            // -------------------------------------------------------------------------------------------
            // ディレクティブのパース
            // -------------------------------------------------------------------------------------------
            const trimmedRule = rule.trimEnd();

            // パラメータあり
            for (const directive of paramDirectives) {
                if (rule.startsWith(`@${directive} `)) {
                    directives.push({
                        type: directive,
                        params: parseParams(rule),
                    });
                    return;
                }
            }
            if (rule.startsWith("@v ")) {
                videoIdsAlias = parseParams(rule);
                return;
            }

            // パラメータなし
            if (trimmedRule === "@strict") {
                directives.push({ type: "strict" });
                return;
            }
            if (trimmedRule === "@disable") {
                directives.push({ type: "disable" });
                return;
            }
            if (trimmedRule === "@end") {
                directives.pop();
                return;
            }
            if (trimmedRule === "@s") {
                isStrictAlias = true;
                return;
            }

            // 有効なディレクティブでなくても@から始まる行はルールとして解釈しない
            if (rule.startsWith("@")) return;

            // -------------------------------------------------------------------------------------------
            // ルールに適用するディレクティブを決定
            // -------------------------------------------------------------------------------------------

            const pushParams = (
                array: string[][],
                directive: { params: string[] },
            ) => {
                const params = directive.params;
                if (params.length > 0) array.push(params);
            };

            let isStrict = false;
            let isDisable = false;
            const include = createDefaultToggle();
            const exclude = createDefaultToggle();

            directives.forEach((directive) => {
                switch (directive.type) {
                    // include
                    case "include-tags":
                        pushParams(include.tags, directive);
                        break;
                    case "include-video-ids":
                        pushParams(include.videoIds, directive);
                        break;
                    case "include-user-ids":
                        pushParams(include.userIds, directive);
                        break;
                    case "include-series-ids":
                        pushParams(include.seriesIds, directive);
                        break;

                    // exclude
                    case "exclude-tags":
                        pushParams(exclude.tags, directive);
                        break;
                    case "exclude-video-ids":
                        pushParams(exclude.videoIds, directive);
                        break;
                    case "exclude-user-ids":
                        pushParams(exclude.userIds, directive);
                        break;
                    case "exclude-series-ids":
                        pushParams(exclude.seriesIds, directive);
                        break;

                    // その他
                    case "strict":
                        isStrict = true;
                        break;
                    case "disable":
                        isDisable = true;
                        break;
                }
            });

            // エイリアスの適用
            if (isStrictAlias) {
                isStrict = true;
                isStrictAlias = false;
            }
            if (videoIdsAlias.length > 0) {
                include.videoIds.push(videoIdsAlias);
                videoIdsAlias = [];
            }

            // -------------------------------------------------------------------------------------------
            // ルールのパース
            // -------------------------------------------------------------------------------------------

            const regexResult = /^\/(.*)\/(.*)$/.exec(rule);
            const regexStr = regexResult?.[1];
            const flags = regexResult?.[2];

            let regex: RegExp | undefined;
            if (regexStr !== undefined && flags !== undefined) {
                // 想定外のフラグが含まれている場合はルールとして解釈しない
                if (!/^[isuvm]*$/.test(flags)) {
                    invalidCount++;
                    return;
                }

                try {
                    regex = RegExp(regexStr, flags);
                } catch {
                    invalidCount++;
                    return;
                }
            }

            rules.push({
                ...{
                    rule: regex ?? rule,
                    isStrict,
                    isDisable,
                    include,
                    exclude,
                },
                ...(hasIndex ? { index } : {}),
            });
        });

    return { rules, invalidCount };
}
