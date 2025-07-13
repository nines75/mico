import { NiconicoComment, Thread } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { ConditionalPick } from "type-fest";
import { FilteredData } from "./filter-comment.js";
import { CommentData } from "@/types/storage/log-comment.types.js";

export abstract class Filter<T> {
    protected filteredComments: CommentData = new Map();
    protected settings: Settings;
    protected abstract log: T;

    constructor(settings: Settings) {
        this.settings = settings;
    }

    abstract filtering(threads: Thread[], isStrictOnly: boolean): void;
    abstract getCount(): number;
    abstract sortLog(): void;

    getLog() {
        return this.log;
    }

    getComments() {
        return this.filteredComments;
    }
}

export abstract class CustomFilter<T> extends Filter<T> {
    private excludeCount = 0;
    private includeCount = 0;
    protected invalidCount = 0;
    protected ngUserIds: Set<string>;
    protected strictNgUserIds: string[] = [];
    protected abstract filter: CustomRuleData<CustomRule>;

    constructor(settings: Settings, ngUserIds: Set<string>) {
        super(settings);
        this.ngUserIds = ngUserIds;
    }

    getIncludeCount(): number {
        return this.includeCount;
    }

    getExcludeCount(): number {
        return this.excludeCount;
    }

    getInvalidCount(): number {
        return this.invalidCount;
    }

    getRuleCount(): number {
        return this.filter.rules.length;
    }

    getStrictNgUserIds(): string[] {
        return this.strictNgUserIds;
    }

    filterRuleByTag(tags: string[]) {
        const testTags = (target: string[], regex: RegExp) => {
            return target.some((tag) => regex.test(tag));
        };

        this.filter.rules = this.filter.rules.filter(({ include, exclude }) => {
            if (
                include.length > 0 &&
                include.every((regex) => !testTags(tags, regex))
            ) {
                return false;
            }
            if (
                exclude.length > 0 &&
                exclude.some((regex) => testTags(tags, regex))
            ) {
                // 除外されたかどうか(exclude)はこの時点で確定するので、ここでカウントする
                this.excludeCount++;
                return false;
            }

            // 除外されなかったどうか(include)はこの時点まで確定しないため、ここでカウントする
            if (include.length > 0) this.includeCount++;

            return true;
        });
    }
}

type CustomFilterType = ConditionalPick<
    FilteredData["filters"],
    CustomFilter<unknown>
>;

export function getCustomFilters(
    filters: FilteredData["filters"],
): CustomFilterType {
    return {
        commandFilter: filters.commandFilter,
        wordFilter: filters.wordFilter,
    };
}

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

interface BaseCustomRuleData {
    rules: BaseCustomRule[];
    invalidCount: number;
}

export interface BaseCustomRule {
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

export function extractCustomRule(filter: string): BaseCustomRuleData {
    interface Section {
        type: "include" | "exclude" | "strict" | "disable";
        value: RegExp[];
    }

    let invalidCount = 0;
    const section: Section[] = [];
    const rules: BaseCustomRule[] = [];

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

export function sortCommentId(
    ids: string[],
    comments: CommentData,
    isSortByScore = false,
): string[] {
    // ソートによって元のデータが破壊されないようにシャローコピーを行う
    // そのままだと元の配列自体の参照が渡されるが、コピーすることで個々のオブジェクトの参照が新たな配列に入るため元のデータが破壊されない
    const idsCopy = [...ids];

    idsCopy.sort((idA, idB) => {
        const a = comments.get(idA) as NiconicoComment;
        const b = comments.get(idB) as NiconicoComment;

        return a.body.localeCompare(b.body);
    });

    if (isSortByScore) {
        idsCopy.sort((idA, idB) => {
            const a = comments.get(idA) as NiconicoComment;
            const b = comments.get(idB) as NiconicoComment;

            return a.score - b.score;
        });
    }

    return idsCopy;
}
