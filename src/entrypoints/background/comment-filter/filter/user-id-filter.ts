import type { Settings } from "@/types/storage/settings.types";
import type { Thread } from "@/types/api/comment.types";
import { isString } from "@/utils/util";
import { parseFilter } from "../../parse-filter";
import { RuleFilter } from "../rule-filter";
import { objectKeys } from "ts-extras";
import type { Rule } from "../../rule";
import { createDefaultRule } from "../../rule";

export class UserIdFilter extends RuleFilter {
    constructor(settings: Settings) {
        super(settings, "commentUserId");
    }

    override filtering(threads: Thread[]): void {
        const rules = this.rules;
        if (rules.length === 0) return;

        this.traverseThreads(threads, (comment) => {
            const { userId } = comment;

            for (const { pattern, id } of rules) {
                if (
                    isString(pattern)
                        ? userId !== pattern
                        : !pattern.test(userId)
                )
                    continue;

                this.filteredComments.push({
                    comment,
                    pattern,
                    target: "user-id",
                    ...(id !== undefined && { id }),
                });

                return false;
            }

            return true;
        });
    }

    updateFilter(userIds: string[]) {
        const newUserIds = userIds.map((id): Rule => {
            return {
                pattern: id,
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
            .map(({ pattern }) => pattern)
            .filter((pattern) => isString(pattern)),
    );
}
