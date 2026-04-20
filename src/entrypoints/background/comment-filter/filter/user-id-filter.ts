import type { Settings } from "@/types/storage/settings.types";
import type { Thread } from "@/types/api/comment.types";
import { isString } from "@/utils/util";
import { RuleFilter } from "../rule-filter";
import type { Rule } from "../../rule";
import { createDefaultRule } from "../../rule";
import type { StrictData } from "../strict-filter";

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

    updateFilter(strictData: StrictData[]) {
        const ruleIds: string[] = [];

        this.rules = [
            // フィルターと同じ順序になるように先頭に追加する
            ...strictData.map(({ userId }): Rule => {
                const ruleId = crypto.randomUUID();
                ruleIds.push(ruleId);

                return {
                    ...createDefaultRule(),
                    id: ruleId,
                    pattern: userId,
                };
            }),
            ...this.rules,
        ];

        return ruleIds;
    }
}
