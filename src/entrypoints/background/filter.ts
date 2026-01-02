export interface Rule {
    /** 元のフィルターを改行区切りで配列にしたときのインデックス */
    index?: number;
    rule: string | RegExp;
    isStrict: boolean;
    isDisable: boolean;
    include: string[][];
    exclude: string[][];
    includeVideoIds: string[][];
}

export function parseFilter(
    filter: string,
    hasIndex = false,
): {
    rules: Rule[];
    invalidCount: number;
} {
    interface Directive {
        type: "include" | "exclude" | "strict" | "disable";
        params: string[];
    }

    let invalidCount = 0;
    let isStrictAlias = false;
    let includeVideoIdsAlias: string[] = [];
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
            const trimmedRule = rule.trimEnd();

            if (rule.startsWith("@include ")) {
                directives.push({ type: "include", params: parseParams(rule) });
                return;
            }
            if (rule.startsWith("@exclude ")) {
                directives.push({ type: "exclude", params: parseParams(rule) });
                return;
            }
            if (rule.startsWith("@v ")) {
                includeVideoIdsAlias = parseParams(rule);
                return;
            }
            if (trimmedRule === "@strict") {
                directives.push({ type: "strict", params: [] });
                return;
            }
            if (trimmedRule === "@disable") {
                directives.push({ type: "disable", params: [] });
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

            const include: string[][] = [];
            const exclude: string[][] = [];
            const includeVideoIds: string[][] = [];
            let isStrict = false;
            let isDisable = false;
            directives.forEach(({ type, params }) => {
                switch (type) {
                    case "include":
                        include.push(params);
                        break;
                    case "exclude":
                        exclude.push(params);
                        break;
                    case "strict":
                        isStrict = true;
                        break;
                    case "disable":
                        isDisable = true;
                        break;
                }
            });

            if (isStrictAlias) {
                isStrict = true;
                isStrictAlias = false;
            }
            if (includeVideoIdsAlias.length > 0) {
                includeVideoIds.push(includeVideoIdsAlias);
                includeVideoIdsAlias = [];
            }

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
                    includeVideoIds,
                },
                ...(hasIndex ? { index } : {}),
            });
        });

    return { rules, invalidCount };
}
