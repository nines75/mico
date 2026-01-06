import { createDefaultToggle, type Rule } from "./rule";

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
          type: "strict" | "disable";
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

    const parseArgs = (line: string) => {
        return line
            .split(" ")
            .slice(1)
            .filter((arg) => arg !== "")
            .map((arg) => arg.toLowerCase());
    };

    filter
        .split("\n")
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line !== "" && !line.startsWith("#"))
        .forEach(({ line, index }) => {
            // -------------------------------------------------------------------------------------------
            // ディレクティブのパース
            // -------------------------------------------------------------------------------------------
            const trimmedRule = line.trimEnd();

            // 引数あり
            for (const directive of argsDirectives) {
                if (line.startsWith(`@${directive} `)) {
                    directives.push({
                        type: directive,
                        args: parseArgs(line),
                    });
                    return;
                }
            }
            if (line.startsWith("@v ")) {
                videoIdsAlias = parseArgs(line);
                return;
            }

            // 引数なし
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
            if (line.startsWith("@")) return;

            // -------------------------------------------------------------------------------------------
            // ルールに適用するディレクティブを決定
            // -------------------------------------------------------------------------------------------

            const pushArgs = (
                array: string[][],
                directive: { args: string[] },
            ) => {
                const args = directive.args;
                if (args.length > 0) array.push(args);
            };

            let isStrict = false;
            let isDisable = false;
            const include = createDefaultToggle();
            const exclude = createDefaultToggle();

            directives.forEach((directive) => {
                switch (directive.type) {
                    // include
                    case "include-tags":
                        pushArgs(include.tags, directive);
                        break;
                    case "include-video-ids":
                        pushArgs(include.videoIds, directive);
                        break;
                    case "include-user-ids":
                        pushArgs(include.userIds, directive);
                        break;
                    case "include-series-ids":
                        pushArgs(include.seriesIds, directive);
                        break;

                    // exclude
                    case "exclude-tags":
                        pushArgs(exclude.tags, directive);
                        break;
                    case "exclude-video-ids":
                        pushArgs(exclude.videoIds, directive);
                        break;
                    case "exclude-user-ids":
                        pushArgs(exclude.userIds, directive);
                        break;
                    case "exclude-series-ids":
                        pushArgs(exclude.seriesIds, directive);
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

            const regexResult = /^\/(.*)\/(.*)$/.exec(line);
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
                    rule: regex ?? line,
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
