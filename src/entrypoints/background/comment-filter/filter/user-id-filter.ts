import { Settings } from "@/types/storage/settings.types.js";
import { Thread } from "@/types/api/comment.types.js";
import { Filter } from "../filter.js";
import { pushCommonLog } from "@/utils/util.js";
import { CommonLog } from "@/types/storage/log.types.js";
import { CountableFilter, Rule, parseFilter } from "../../filter.js";

export class UserIdFilter extends Filter<CommonLog> implements CountableFilter {
    private filter = new Set<string>();
    protected log: CommonLog = new Map();

    constructor(settings: Settings, videoId: string) {
        super(settings);

        this.filter = getNgUserIdSet(settings, videoId);
    }

    setSettings(settings: Settings) {
        this.settings = settings;
    }

    override filtering(threads: Thread[]): void {
        if (this.filter.size === 0) return;

        this.traverseThreads(threads, (comment) => {
            const { id, userId } = comment;

            if (this.filter.has(userId)) {
                pushCommonLog(this.log, userId, id);
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
        userIds.forEach((id) => this.filter.add(id));
    }

    countRules(): number {
        return this.filter.size;
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
