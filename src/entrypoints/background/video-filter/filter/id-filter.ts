import { RecommendData } from "@/types/api/recommend.types.js";
import { Filter, sortVideoId } from "../filter.js";
import { extractRule } from "../../comment-filter/filter.js";
import { IdLog } from "@/types/storage/log.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { pattern } from "@/utils/config.js";

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
        const rules = extractRule(this.settings.ngVideoFilterId);
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
}
