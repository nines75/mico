import type { NiconicoComment, Thread } from "@/types/api/comment.types";
import type { Settings } from "@/types/storage/settings.types";
import { sortCommentId } from "../filter";
import { isString, pushCommonLog } from "@/utils/util";
import type { WordLog } from "@/types/storage/log-comment.types";
import { StrictFilter } from "../strict-filter";

export class WordFilter extends StrictFilter<WordLog> {
    protected override log: WordLog = new Map();

    constructor(settings: Settings) {
        super(settings, "commentBody");
    }

    override filtering(threads: Thread[], isStrictOnly = false): void {
        const rules = isStrictOnly
            ? this.rules.filter((rule) => rule.isStrict)
            : this.rules.filter((rule) => !rule.isStrict);
        if (rules.length === 0) return;

        this.traverseThreads(threads, (comment) => {
            const { id, body, userId } = comment;

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

                const key = this.createKey(pattern);
                const map = this.log.get(key);
                if (map === undefined) {
                    this.log.set(key, new Map([[body, [id]]]));
                } else {
                    pushCommonLog(map, body, id);
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
        const keys = this.rules.map(({ pattern }) => this.createKey(pattern));

        // フィルター順にソート
        for (const key of keys) {
            const map = this.log.get(key);
            if (map !== undefined) {
                log.set(key, map);
            }
        }

        // 各ルールのコメントをソート
        for (const [key, map] of log) {
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
        }

        this.log = log;
    }
}
