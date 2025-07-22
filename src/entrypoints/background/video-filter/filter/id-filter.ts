import { Filter, sortVideoId } from "../filter.js";
import { Settings } from "@/types/storage/settings.types.js";
import { pattern } from "@/utils/config.js";
import { loadSettings, setSettings } from "@/utils/storage.js";
import { countCommonLog } from "@/utils/util.js";
import { IdLog } from "@/types/storage/log-video.types.js";
import { extractRule } from "../../filter.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";

interface NgIds {
    userIds: Set<string>;
    videoIds: Set<string>;
}

export class IdFilter extends Filter<IdLog> {
    private filter: NgIds;
    protected override log: IdLog = {
        userId: new Map(),
        videoId: [],
    };

    constructor(settings: Settings) {
        super(settings);

        this.filter = this.createFilter();
    }

    override filtering(data: { videos: NiconicoVideo[] }): void {
        data.videos = data.videos.filter((video) => {
            const userId = video.owner?.id;
            const videoId = video.id;

            // ユーザーIDによるフィルタリング
            if (userId !== undefined && this.filter.userIds.has(userId)) {
                const ids = this.log.userId;

                if (ids.has(userId)) {
                    ids.get(userId)?.push(videoId);
                } else {
                    ids.set(userId, [videoId]);
                }

                this.filteredVideos.set(videoId, video);

                return false;
            }

            // 動画IDによるフィルタリング
            if (this.filter.videoIds.has(videoId)) {
                this.log.videoId.push(videoId);
                this.filteredVideos.set(videoId, video);

                return false;
            }

            return true;
        });
    }

    override isNgVideo(video: NiconicoVideo): boolean {
        const userId = video.owner?.id;
        const videoId = video.id;

        if (userId === undefined) return false;

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
        return countCommonLog(this.log.userId) + this.log.videoId.length;
    }

    createFilter(): NgIds {
        const rules = extractRule(this.settings.ngId);
        const userIds = new Set<string>();
        const videoIds = new Set<string>();

        rules
            .map((rule) => rule.rule)
            .forEach((ruleStr) => {
                if (pattern.regex.checkRawUserId.test(ruleStr)) {
                    userIds.add(ruleStr);
                } else if (pattern.regex.checkVideoId.test(ruleStr)) {
                    videoIds.add(ruleStr);
                } else {
                    this.invalidCount++;
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
