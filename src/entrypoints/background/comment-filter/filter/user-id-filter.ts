import { UserIdLog } from "@/types/storage/log.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { Thread } from "@/types/api/comment.types.js";
import { sortCommentId } from "../sort-log.js";
import { extractRule, Filter, Rule } from "../filter.js";
import { loadSettings, setSettings } from "@/utils/storage.js";

export class UserIdFilter extends Filter<UserIdLog> {
    private filter = new Set<string>();
    protected log: UserIdLog = new Map();

    constructor(settings: Settings, videoId: string) {
        super(settings);

        this.filter = getNgUserIdSet(settings, videoId);
    }

    updateFilter(userIds: Set<string>) {
        userIds.forEach((id) => this.filter.add(id));
    }

    setSettings(settings: Settings) {
        this.settings = settings;
    }

    filtering(threads: Thread[]): void {
        if (this.filter.size === 0) return;

        threads.forEach((thread) => {
            thread.comments = thread.comments.filter((comment) => {
                const { id, userId, nicoruCount: nicoru } = comment;

                if (
                    this.settings.isIgnoreByNicoru &&
                    nicoru >= this.settings.IgnoreByNicoruCount
                )
                    return true;

                if (this.filter.has(userId)) {
                    if (this.log.has(userId)) {
                        this.log.get(userId)?.push(id);
                    } else {
                        this.log.set(userId, [id]);
                    }

                    this.filteredComments.set(comment.id, comment);

                    return false;
                }

                return true;
            });
        });
    }

    sortLog(): void {
        const log: UserIdLog = new Map();
        const ngUserIds = getNgUserIdSet(this.settings); // strictルールによってユーザーIDが追加されている場合があるので改めて取得する

        // フィルター昇順にソート
        ngUserIds.forEach((userId) => {
            if (this.log.has(userId)) {
                log.set(userId, this.log.get(userId) ?? []);
            }
        });

        this.log = log;

        // 各ルールのコメントをソート
        this.log.forEach((ids, userId) => {
            this.log.set(
                userId,
                this.settings.isShowNgScoreInLog
                    ? sortCommentId([...ids], this.filteredComments, true)
                    : sortCommentId([...ids], this.filteredComments),
            );
        });
    }

    getCount(): number {
        return this.log.values().reduce((sum, ids) => sum + ids.length, 0);
    }
}

function getNgUserId(settings: Settings, videoId?: string) {
    const res: Rule[] = [];

    extractRule(settings.ngUserId).forEach((data) => {
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
        const value =
            settings.ngUserId === "" ? str : `${str}\n${settings.ngUserId}`;

        return {
            ngUserId: value,
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
