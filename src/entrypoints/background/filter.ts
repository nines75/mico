export interface Rule {
    rule: string;
    /** 元のフィルターを改行区切りで配列にしたときのインデックス */
    index: number;
}

export interface CustomRuleData<T extends CustomRule> {
    rules: T[];
}

export interface CustomRule {
    isStrict: boolean;
    include: RegExp[];
    exclude: RegExp[];
}

interface RawCustomRuleData {
    rules: RawCustomRule[];
    invalidCount: number;
}

export interface RawCustomRule {
    rule: string;
    isStrict: boolean;
    isDisable: boolean;
    include: RegExp[];
    exclude: RegExp[];
}

export function extractRule(filter: string) {
    return filter
        .split("\n")
        .map((str, index): Rule => {
            return {
                // どんな文字列に対しても必ずマッチする
                rule: str.match(/^(.*?)(\s*(?<!\\)#.*)?$/)?.[1] as string,
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

export function extractCustomRule(filter: string): RawCustomRuleData {
    interface Section {
        type: "include" | "exclude" | "strict" | "disable";
        value: RegExp[];
    }

    let invalidCount = 0;
    const section: Section[] = [];
    const rules: RawCustomRule[] = [];

    const extractTagRules = (str: string) => {
        return str
            .split(" ")
            .filter((rule) => rule !== "")
            .slice(1)
            .reduce<RegExp[]>((res, rule) => {
                try {
                    const regex = RegExp(rule, "i");
                    res.push(regex);
                } catch {
                    invalidCount++;
                }

                return res;
            }, []);
    };

    extractRule(filter).forEach((data) => {
        const rule = data.rule;
        const trimmedRule = rule.trimEnd();

        // セクション解析
        if (rule.startsWith("@include ")) {
            section.push({ type: "include", value: extractTagRules(rule) });
            return;
        }
        if (rule.startsWith("@exclude ")) {
            section.push({ type: "exclude", value: extractTagRules(rule) });
            return;
        }
        if (trimmedRule === "@strict") {
            section.push({ type: "strict", value: [] });
            return;
        }
        if (trimmedRule === "@disable") {
            section.push({ type: "disable", value: [] });
            return;
        }
        if (trimmedRule === "@end") {
            section.pop();
            return;
        }

        // 現在のセクションをもとに適用させるルールを取り出す
        const include: RegExp[] = [];
        const exclude: RegExp[] = [];
        let isStrict = false as boolean; // ESLintの誤検知を抑制
        let isDisable = false as boolean;
        section.forEach(({ type, value }) => {
            switch (type) {
                case "include":
                    include.push(...value);
                    break;
                case "exclude":
                    exclude.push(...value);
                    break;
                case "strict":
                    isStrict = true;
                    break;
                case "disable":
                    isDisable = true;
                    break;
            }
        });

        const hasStrictSymbol = rule.startsWith("!");
        const hasEscapeSymbol = rule.startsWith("\\");

        rules.push({
            rule: hasStrictSymbol || hasEscapeSymbol ? rule.slice(1) : rule,
            isStrict: isStrict || hasStrictSymbol,
            isDisable,
            include,
            exclude,
        });
    });

    return { rules, invalidCount };
}
