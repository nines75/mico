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
    include: string[];
    exclude: string[];
}

export interface RawCustomRule {
    rule: string;
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
                rule: str.match(/^(.*?)(?:\s*(?<!\\)#.*)?$/)?.[1] as string,
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

export function parseCustomFilter(filter: string): RawCustomRule[] {
    interface Directive {
        type: "include" | "exclude" | "strict" | "disable";
        params: string[];
    }

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

        // セクション解析
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

        const escapedRule = rule.match(/^@escape\((.+)\)/)?.[1];
        const hasStrictSymbol = rule.startsWith("!");

        rules.push({
            rule: escapedRule ?? (hasStrictSymbol ? rule.slice(1) : rule),
            isStrict: isStrict || hasStrictSymbol,
            isDisable,
            include,
            exclude,
        });
    });

    return rules;
}
