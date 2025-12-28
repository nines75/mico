import { Settings } from "@/types/storage/settings.types.js";
import { Thread } from "@/types/api/comment.types.js";
import { isString, pushCommonLog } from "@/utils/util.js";
import { CommonLog } from "@/types/storage/log.types.js";
import { BaseRule, parseFilterBase } from "../../filter.js";
import { RuleFilter } from "../rule-filter.js";

export class UserIdFilter extends RuleFilter<CommonLog> {
    protected log: CommonLog = new Map();

    constructor(settings: Settings) {
        super(settings, settings.ngUserId);
    }

    override filtering(threads: Thread[]): void {
        const rules = this.rules;
        if (rules.length === 0) return;

        const userIdSet = new Set<string>();
        const regexes: RegExp[] = [];
        rules
            .map((data) => data.rule)
            .forEach((rule) => {
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
                        key = regex.toString();
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
        const ngUserIds = new Set(
            this.rules.map(({ rule }) => this.createKey(rule)),
        );

        this.log = this.sortCommonLog(this.log, ngUserIds);
    }

    updateFilter(userIds: Set<string>) {
        const newUserIds = [...userIds].map((id) => {
            return {
                rule: id,
                isStrict: false,
                isDisable: false,
                include: [],
                exclude: [],
            };
        });

        // フィルターと同じ順序になるように先頭に追加する
        this.rules = [...newUserIds, ...this.rules];
    }
}

export function createUserIdFilter(settings: Settings, videoId?: string) {
    const res: BaseRule[] = [];

    parseFilterBase(settings.ngUserId).forEach((data) => {
        const rule = data.rule;
        const index = rule.indexOf("@");

        if (index === -1) {
            res.push(data);
        } else {
            if (videoId === undefined || videoId === rule.slice(0, index)) {
                res.push({ ...data, ...{ rule: rule.slice(index + 1) } });
            }
        }
    });

    return res;
}

export function getNgUserIdSet(settings: Settings, videoId?: string) {
    return new Set(
        createUserIdFilter(settings, videoId).map((data) => data.rule),
    );
}

export function formatNgUserId(
    id: string,
    context: string,
    settings: Settings,
) {
    return settings.isCommentNgContextAppended ? `# ${context}\n${id}\n` : id;
}
