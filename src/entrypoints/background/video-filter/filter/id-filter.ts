import { NiconicoVideo, RecommendData } from "@/types/api/recommend.types.js";
import { Filter, sortVideoId } from "../filter.js";
import { extractRule } from "../../comment-filter/filter.js";
import { IdLog } from "@/types/storage/log.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { pattern } from "@/utils/config.js";
import { loadSettings, setSettings } from "@/utils/storage.js";

interface NgIds {
    userIds: Set<string>;
    videoIds: Set<string>;
}

export class IdFilter extends Filter<IdLog> {
    filter: NgIds;
    protected override log: IdLog = {
        userId: new Map(),
        videoId: [],
    };

    constructor(settings: Settings) {
        super(settings);

        this.filter = this.getFilter();
    }

    override filtering(recommendData: RecommendData): void {
        recommendData.items = recommendData.items.filter((item) => {
            if (item.contentType === "mylist") return true;

            const userId = item.content.owner.id;
            const videoId = item.id;

            // ユーザーIDによるフィルタリング
            if (this.filter.userIds.has(userId)) {
                const ids = this.log.userId;

                if (ids.has(userId)) {
                    ids.get(userId)?.push(videoId);
                } else {
                    ids.set(userId, [videoId]);
                }

                this.filteredVideos.set(videoId, item.content);

                return false;
            }

            // 動画IDによるフィルタリング
            if (this.filter.videoIds.has(videoId)) {
                this.log.videoId.push(videoId);
                this.filteredVideos.set(videoId, item.content);

                return false;
            }

            return true;
        });
    }

    override isNgVideo(video: NiconicoVideo): boolean {
        const userId = video.owner.id;
        const videoId = video.id;

        if (
            this.filter.userIds.has(userId) ||
            this.filter.videoIds.has(videoId)
        ) {
            return true;
        }

        return false;
    }

    override sortLog(): void {
        // ユーザーIDによるフィルタリングのログをソート
        {
            const userIdLog: IdLog["userId"] = new Map();

            // フィルター昇順にソート
            this.filter.userIds.forEach((userId) => {
                if (this.log.userId.has(userId)) {
                    userIdLog.set(userId, this.log.userId.get(userId) ?? []);
                }
            });

            this.log.userId = userIdLog;

            // 各ルールのコメントをソート
            this.log.userId.forEach((ids, userId) => {
                this.log.userId.set(
                    userId,
                    sortVideoId(ids, this.filteredVideos),
                );
            });
        }

        // 動画IDによるフィルタリングのログをソート
        this.log.videoId = sortVideoId(this.log.videoId, this.filteredVideos);
    }

    override getCount(): number {
        return (
            this.log.userId.values().reduce((sum, ids) => sum + ids.length, 0) +
            this.log.videoId.length
        );
    }

    getFilter(): NgIds {
        const rules = extractRule(this.settings.ngId);
        const userIds = new Set<string>();
        const videoIds = new Set<string>();

        rules
            .map((rule) => rule.rule)
            .forEach((ruleStr) => {
                if (pattern.regex.checkVideoId.test(ruleStr)) {
                    videoIds.add(ruleStr);
                } else {
                    userIds.add(ruleStr);
                }
            });

        return {
            userIds,
            videoIds,
        };
    }

    getRuleCount(): number {
        return this.filter.userIds.size + this.filter.videoIds.size;
    }
}

export async function addNgId(ids: Set<string>) {
    if (ids.size === 0) return;

    const str = [...ids].join("\n");
    const func = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();
        const value = settings.ngId === "" ? str : `${str}\n${settings.ngId}`;

        return {
            ngId: value,
        };
    };

    await setSettings(func);
}

export async function removeNgId(ids: Set<string>) {
    if (ids.size === 0) return;

    const func = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        const toRemoveLines = new Set(
            extractRule(settings.ngId)
                .filter((data) => ids.has(data.rule))
                .map((data) => data.index),
        );
        const value = settings.ngId
            .split("\n")
            .filter((_, index) => !toRemoveLines.has(index))
            .join("\n");

        return {
            ngId: value,
        };
    };

    await setSettings(func);
}
