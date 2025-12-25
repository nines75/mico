export interface Rule {
    rule: string;
    /** 元のフィルターを改行区切りで配列にしたときのインデックス */
    index: number;
}

// export interface CustomRuleData<T extends CustomRule> {
//     rules: T[];
// }
export interface CustomRuleData{
    rules: RawCustomRule[]
}

export interface CustomRule {
    isStrict: boolean;
    include: string[];
    exclude: string[];
}

export interface RawCustomRuleData {
    rules: RawCustomRule[];
    invalid: number;
}

export interface RawCustomRule {
    rule: string | RegExp;
    isStrict: boolean;
    isDisable: boolean;
    include: string[];
    exclude: string[];
}

export function parseFilter(filter: string) {
    return filter
        .split("\n")
        .map((str, index): Rule => {
            return {
                // どんな文字列に対しても必ずマッチする
                rule: /^(.*?)(?:\s*(?<!\\)#.*)?$/.exec(str)?.[1] as string,
                index,
            };
        })
        .filter((data) => data.rule !== "")
        .map((data): Rule => {
            return {
                rule: data.rule.replace(/\\#/g, "#"), // "\#"という文字列をエスケープ
                index: data.index,
            };
        });
}

export function parseCustomFilter(filter: string): RawCustomRuleData {
    interface Directive {
        type: "include" | "exclude" | "strict" | "disable";
        params: string[];
    }

    let invalidCount = 0;
    const directives: Directive[] = [];
    const rules: RawCustomRule[] = [];

    const parseParams = (str: string) => {
        return str
            .split(" ")
            .filter((rule) => rule !== "")
            .slice(1)
            .map((rule) => rule.toLowerCase());
    };

    parseFilter(filter).forEach((data) => {
        const rule = data.rule;
        const trimmedRule = rule.trimEnd();

        if (rule.startsWith("@include ")) {
            directives.push({ type: "include", params: parseParams(rule) });
            return;
        }
        if (rule.startsWith("@exclude ")) {
            directives.push({ type: "exclude", params: parseParams(rule) });
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

        const include: string[] = [];
        const exclude: string[] = [];
        let isStrict = false as boolean; // no-unnecessary-conditionによる誤検知を抑制
        let isDisable = false;
        directives.forEach(({ type, params }) => {
            switch (type) {
                case "include":
                    include.push(...params);
                    break;
                case "exclude":
                    exclude.push(...params);
                    break;
                case "strict":
                    isStrict = true;
                    break;
                case "disable":
                    isDisable = true;
                    break;
            }
        });

        const escapedRule = /^@escape\((.+)\)/.exec(rule)?.[1];
        const hasStrictSymbol = rule.startsWith("!");

        const baseRule =
            escapedRule ?? (hasStrictSymbol ? rule.slice(1) : rule);

        const regexResult = /^\/(.*)\/(.*)$/.exec(baseRule);
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
            rule: regex ?? baseRule,
            isStrict: isStrict || hasStrictSymbol,
            isDisable,
            include,
            exclude,
        });
    });

    return { rules, invalid: invalidCount };
}

export interface CountableFilter {
    countRules(): number;
}
