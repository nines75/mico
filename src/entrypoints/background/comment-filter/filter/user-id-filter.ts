import { Settings } from "@/types/storage/settings.types.js";
import { Thread } from "@/types/api/comment.types.js";
import { CustomFilter } from "../filter.js";
import { isString, pushCommonLog } from "@/utils/util.js";
import { CommonLog } from "@/types/storage/log.types.js";
import {
    CustomRuleData,
    Rule,
    parseCustomFilter,
    parseFilter,
} from "../../filter.js";

export class UserIdFilter extends CustomFilter<CommonLog> {
    protected filter: CustomRuleData;
    protected log: CommonLog = new Map();

    constructor(settings: Settings) {
        super(settings);

        this.filter = this.createFilter(settings);
    }

    setSettings(settings: Settings) {
        this.settings = settings;
    }

    override filtering(threads: Thread[]): void {
        const rules = this.filter.rules;
        if (rules.length === 0) return;

        const userIdSet = new Set<string>();
        const regexRules: RegExp[] = [];
        rules
            .map((data) => data.rule)
            .forEach((rule) => {
                if (isString(rule)) {
                    userIdSet.add(rule);
                } else {
                    regexRules.push(rule);
                }
            });

        this.traverseThreads(threads, (comment) => {
            let key: string | undefined;
            const { id, userId } = comment;

            if (
                userIdSet.has(userId) ||
                regexRules.some((regex) => {
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
        // strictルールによってユーザーIDがNG登録されていることがあるので、フィールドの値を使わずに改めて取得する
        const ngUserIds = getNgUserIdSet(this.settings);

        this.log = this.sortCommonLog(this.log, ngUserIds);
    }

    updateFilter(userIds: Set<string>) {
        userIds.forEach((id) =>
            this.filter.rules.push({
                rule: id,
                isStrict: false,
                isDisable: false,
                include: [],
                exclude: [],
            }),
        );
    }

    createFilter(settings: Settings): CustomRuleData {
        const parsedFilter = parseCustomFilter(settings.ngUserId);
        this.invalidCount += parsedFilter.invalid;

        return {
            rules: parsedFilter.rules,
        };
    }
}

export function createUserIdFilter(settings: Settings, videoId?: string) {
    const res: Rule[] = [];

    parseFilter(settings.ngUserId).forEach((data) => {
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
