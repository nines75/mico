import type { NiconicoComment, Thread } from "@/types/api/comment.types.js";
import type { Settings } from "@/types/storage/settings.types.js";
import { sortCommentId } from "../filter.js";
import { isString, pushCommonLog } from "@/utils/util.js";
import type { WordLog } from "@/types/storage/log-comment.types.js";
import { StrictFilter } from "../strict-filter.js";

export class WordFilter extends StrictFilter<WordLog> {
    protected log: WordLog = new Map();

    constructor(settings: Settings, ngUserIds: Set<string>) {
        super(settings, ngUserIds, settings.ngWord);
    }

    override filtering(threads: Thread[], isStrictOnly = false): void {
        const rules = isStrictOnly
            ? this.rules.filter((rule) => rule.isStrict)
            : this.rules.filter((rule) => !rule.isStrict);
        if (rules.length === 0) return;

        this.traverseThreads(threads, (comment) => {
            const { id, body, userId } = comment;

            for (const { rule } of rules) {
                if (isString(rule) ? !body.includes(rule) : !rule.test(body))
                    continue;

                if (isStrictOnly) {
                    if (!this.ngUserIds.has(userId)) {
                        this.strictData.push({
                            userId,
                            context: `body(strict): ${body}`,
                        });
                    }

                    // strictルールにマッチした場合はNGユーザーIDによるフィルタリングログに表示されるようにしたいので、ここではフィルタリングしない
                    return true;
                }

                const key = this.createKey(rule);
                const map = this.log.get(key);
                if (map !== undefined) {
                    pushCommonLog(map, body, id);
                } else {
                    this.log.set(key, new Map([[body, [id]]]));
                }

                this.filteredComments.set(id, comment);
                this.blockedCount++;

                return false;
            }

            return true;
        });
    }

    override sortLog(): void {
        const log: WordLog = new Map();
        const keys = new Set(
            this.rules.map(({ rule }) => this.createKey(rule)),
        );

        // フィルター順にソート
        keys.forEach((key) => {
            const map = this.log.get(key);
            if (map !== undefined) {
                log.set(key, map);
            }
        });

        // 各ルールのコメントをソート
        log.forEach((map, key) => {
            const sampleIds = [...map.values()].map((ids) => ids[0] as string); // コメントIDは必ず一つ以上存在する
            const sortedMap = new Map(
                sortCommentId(sampleIds, this.filteredComments).map((id) => {
                    const comment = this.filteredComments.get(
                        id,
                    ) as NiconicoComment;
                    const ids = map.get(comment.body) as string[];

                    return [comment.body, ids];
                }),
            );

            log.set(key, sortedMap);
        });

        this.log = log;
    }
}
