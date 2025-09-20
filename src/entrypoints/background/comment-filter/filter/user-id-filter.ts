import { Settings } from "@/types/storage/settings.types.js";
import { Thread } from "@/types/api/comment.types.js";
import { Filter } from "../filter.js";
import { loadSettings, setSettings } from "@/utils/storage.js";
import { countCommonLog, pushCommonLog } from "@/utils/util.js";
import { CommonLog } from "@/types/storage/log.types.js";
import { Rule, parseFilter } from "../../filter.js";

export class UserIdFilter extends Filter<CommonLog> {
    private filter = new Set<string>();
    protected log: CommonLog = new Map();

    constructor(settings: Settings, videoId: string) {
        super(settings);

        this.filter = getNgUserIdSet(settings, videoId);
    }

    override filtering(threads: Thread[]): void {
        if (this.filter.size === 0) return;

        threads.forEach((thread) => {
            thread.comments = thread.comments.filter((comment) => {
                if (this.isIgnoreByNicoru(comment)) return true;

                const { id, userId } = comment;

                if (this.filter.has(userId)) {
                    pushCommonLog(this.log, userId, id);
                    this.filteredComments.set(id, comment);

                    return false;
                }

                return true;
            });
        });
    }

    override sortLog(): void {
        // strictルールによってユーザーIDが追加されていることがあるので、フィールドの値を使わずに改めて取得する
        const ngUserIds = getNgUserIdSet(this.settings);

        this.log = this.sortCommonLog(this.log, ngUserIds);
    }

    override getCount(): number {
        return countCommonLog(this.log);
    }

    updateFilter(userIds: Set<string>) {
        userIds.forEach((id) => this.filter.add(id));
    }

    setSettings(settings: Settings) {
        this.settings = settings;
    }
}

function getNgUserId(settings: Settings, videoId?: string) {
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
    return new Set(getNgUserId(settings, videoId).map((data) => data.rule));
}

export async function addNgUserId(userIds: Set<string>) {
    if (userIds.size === 0) return;

    const str = [...userIds].join("\n");
    const func = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        return {
            ngUserId: `${str}\n${settings.ngUserId}`,
        };
    };

    await setSettings(func);
}

export async function removeNgUserId(
    userIds: Set<string>,
    isRemoveSpecific = true,
) {
    if (userIds.size === 0) return;

    const func = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        const toRemoveLines = new Set(
            getNgUserId(settings, isRemoveSpecific ? undefined : "")
                .filter((data) => userIds.has(data.rule))
                .map((data) => data.index),
        );
        const value = settings.ngUserId
            .split("\n")
            .filter((_, index) => !toRemoveLines.has(index))
            .join("\n");

        return {
            ngUserId: value,
        };
    };

    await setSettings(func);
}
