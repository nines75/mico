import type { Settings } from "@/types/storage/settings.types.js";
import type { Thread } from "@/types/api/comment.types.js";
import { isString, pushCommonLog } from "@/utils/util.js";
import type { CommonLog } from "@/types/storage/log.types.js";
import { parseFilter } from "../../parse-filter.js";
import { RuleFilter } from "../rule-filter.js";
import { objectKeys } from "ts-extras";
import type { Rule } from "../../rule.js";
import { createDefaultRule } from "../../rule.js";

export class UserIdFilter extends RuleFilter<CommonLog> {
    protected override log: CommonLog = new Map();

    constructor(settings: Settings) {
        super(settings, settings.ngUserId);
    }

    override filtering(threads: Thread[]): void {
        const rules = this.rules;
        if (rules.length === 0) return;

        const userIdSet = new Set<string>();
        const regexes: RegExp[] = [];
        rules.forEach(({ rule }) => {
            if (isString(rule)) {
                userIdSet.add(rule);
            } else {
                regexes.push(rule);
            }
        });

        this.traverseThreads(threads, (comment) => {
            let key: string | undefined;
            const { id, userId } = comment;

            if (
                userIdSet.has(userId) ||
                regexes.some((regex) => {
                    const isMatch = regex.test(userId);
                    if (isMatch) {
                        // 正規表現ルールではそれ自体をkeyにする
                        key = this.createKey(regex);
                    }

                    return isMatch;
                })
            ) {
                pushCommonLog(this.log, key ?? userId, id);
                this.filteredComments.set(id, comment);
                this.blockedCount++;

                return false;
            }

            return true;
        });
    }

    override sortLog(): void {
        this.log = this.sortCommonLog(
            this.log,
            this.rules.map(({ rule }) => rule),
        );
    }

    updateFilter(userIds: Set<string>) {
        const newUserIds = [...userIds].map((id): Rule => {
            return {
                rule: id,
                ...createDefaultRule(),
            };
        });

        // フィルターと同じ順序になるように先頭に追加する
        this.rules = [...newUserIds, ...this.rules];
    }
}

export function parseNgUserId(settings: Settings, hasSpecific = true) {
    return parseFilter(settings.ngUserId, true).rules.filter(
        ({ include, exclude }) => {
            if (hasSpecific) return true;

            // コンテキストに応じて無効化されないルールのみを返す
            return (
                objectKeys(include).every((key) => include[key].length === 0) &&
                objectKeys(exclude).every((key) => exclude[key].length === 0)
            );
        },
    );
}

/**
 * @returns 文字列かつコンテキストに応じて無効化されないNGユーザーIDのSet
 */
export function getBasicNgUserIdSet(settings: Settings) {
    return new Set(
        parseNgUserId(settings, false)
            .map(({ rule }) => rule)
            .filter((rule) => isString(rule)),
    );
}

export function formatNgUserId(
    id: string,
    context: string,
    settings: Settings,
) {
    return settings.isCommentNgContextAppended ? `# ${context}\n${id}\n` : id;
}
