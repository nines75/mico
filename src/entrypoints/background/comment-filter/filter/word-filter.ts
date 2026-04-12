import type { Thread } from "@/types/api/comment.types";
import type { Settings } from "@/types/storage/settings.types";
import { isString } from "@/utils/util";
import { StrictFilter } from "../strict-filter";

export class WordFilter extends StrictFilter {
    constructor(settings: Settings) {
        super(settings, "commentBody");
    }

    override filtering(threads: Thread[], isStrictOnly = false): void {
        const rules = isStrictOnly
            ? this.rules.filter((rule) => rule.isStrict)
            : this.rules.filter((rule) => !rule.isStrict);
        if (rules.length === 0) return;

        this.traverseThreads(threads, (comment) => {
            const { body, userId } = comment;

            for (const { pattern } of rules) {
                if (
                    isString(pattern)
                        ? !body.includes(pattern)
                        : !pattern.test(body)
                )
                    continue;

                if (isStrictOnly) {
                    if (!this.ngUserIds.has(userId)) {
                        this.strictData.push({
                            userId,
                            context: `comment-body: ${body}`,
                        });
                    }

                    // strictルールにマッチしたコメントはNGユーザーIDによるフィルタリングログに表示させる
                    // そのためここではフィルタリングしない
                    return true;
                }

                this.filteredComments.push({
                    comment,
                    pattern,
                    target: "body",
                });

                return false;
            }

            return true;
        });
    }
}
