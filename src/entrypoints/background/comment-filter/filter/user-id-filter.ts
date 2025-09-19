import { Settings } from "@/types/storage/settings.types.js";
import { Thread } from "@/types/api/comment.types.js";
import { Filter, sortCommentId } from "../filter.js";
import { loadSettings, setSettings } from "@/utils/storage.js";
import { countCommonLog } from "@/utils/util.js";
import { CommonLog } from "@/types/storage/log.types.js";
import { Rule, parseRule } from "../../filter.js";

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

    override sortLog(): void {
        const log: CommonLog = new Map();
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

    parseRule(settings.ngUserId).forEach((data) => {
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
