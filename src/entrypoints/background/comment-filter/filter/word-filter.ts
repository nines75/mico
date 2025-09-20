import { NiconicoComment, Thread } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { CustomFilter, sortCommentId } from "../filter.js";
import { countCommonLog, pushCommonLog } from "@/utils/util.js";
import { WordLog } from "@/types/storage/log-comment.types.js";
import { CustomRuleData, CustomRule, parseCustomFilter } from "../../filter.js";
import { CommonLog } from "@/types/storage/log.types.js";

type NgWordData = CustomRuleData<NgWord>;

interface NgWord extends CustomRule {
    regex: RegExp;
}

export class WordFilter extends CustomFilter<WordLog> {
    protected filter: NgWordData;
    protected log: WordLog = new Map();

    constructor(settings: Settings, ngUserIds: Set<string>) {
        super(settings, ngUserIds);

        this.filter = this.createFilter(settings);
    }

    override filtering(threads: Thread[], isStrictOnly = false): void {
        const rules = isStrictOnly
            ? this.filter.rules.filter((rule) => rule.isStrict)
            : this.filter.rules.filter((rule) => !rule.isStrict);

        if (rules.length === 0) return;

        threads.forEach((thread) => {
            thread.comments = thread.comments.filter((comment) => {
                if (this.isIgnoreByNicoru(comment)) return true;

                const { id, body, userId } = comment;

                for (const { regex } of rules) {
                    if (regex.test(body)) {
                        const regexStr = regex.source;

                        if (isStrictOnly) {
                            if (!this.ngUserIds.has(userId)) {
                                this.strictNgUserIds.push(userId);
                            }

                            // strictルールにマッチした場合はNGユーザーIDによるフィルタリングログに表示されるようにしたいので、ここではフィルタリングしない
                            return true;
                        }

                        if (this.log.has(regexStr)) {
                            const map = this.log.get(regexStr) as CommonLog;
                            pushCommonLog(map, body, id);
                        } else {
                            this.log.set(regexStr, new Map([[body, [id]]]));
                        }

                        this.filteredComments.set(id, comment);

                        return false;
                    }
                }

                return true;
            });
        });
    }

    override sortLog(): void {
        const log: WordLog = new Map();
        const ngWords = new Set(
            this.filter.rules.map((ngWord) => ngWord.regex.source),
        );

        // フィルター昇順にソート
        ngWords.forEach((word) => {
            if (this.log.has(word)) {
                log.set(word, this.log.get(word) ?? new Map());
            }
        });

        this.log = log;

        // 各ルールのコメントをソート
        this.log.forEach((map, word) => {
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

            this.log.set(word, sortedMap);
        });
    }

    override getCount(): number {
        return this.log
            .values()
            .reduce((sum, map) => sum + countCommonLog(map), 0);
    }

    createFilter(settings: Settings): NgWordData {
        const ngWords = parseCustomFilter(settings.ngWord).reduce<NgWord[]>(
            (res, data) => {
                try {
                    const regex = settings.isCaseInsensitive
                        ? RegExp(data.rule, "i")
                        : RegExp(data.rule);

                    res.push({
                        regex,
                        isStrict: data.isStrict,
                        include: data.include,
                        exclude: data.exclude,
                    });
                } catch {
                    this.invalidCount++;
                }

                return res;
            },
            [],
        );

        return {
            rules: ngWords,
        };
    }
}
