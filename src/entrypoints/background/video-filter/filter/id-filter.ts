import { RuleFilter, sortVideoId } from "../filter.js";
import { Settings } from "@/types/storage/settings.types.js";
import { isString, pushCommonLog } from "@/utils/util.js";
import { IdLog } from "@/types/storage/log-video.types.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";

export class IdFilter extends RuleFilter<IdLog> {
    private userIds: Set<string>;
    private videoIds: Set<string>;
    private regexes: RegExp[];
    protected override log: IdLog = {
        regex: new Map(),
        userId: new Map(),
        videoId: [],
    };

    constructor(settings: Settings) {
        super(settings, settings.ngId);

        const userIds = new Set<string>();
        const videoIds = new Set<string>();
        const regexes: RegExp[] = [];

        this.filter.rules
            .map((rule) => rule.rule)
            .forEach((rule) => {
                if (isString(rule)) {
                    if (/^(?:ch)?\d+$/.test(rule)) {
                        userIds.add(rule);
                    } else if (/^(?:sm|so|nl|nm)\d+$/.test(rule)) {
                        videoIds.add(rule);
                    } else {
                        this.invalidCount++;
                    }
                } else {
                    regexes.push(rule);
                }
            });

        this.userIds = userIds;
        this.videoIds = videoIds;
        this.regexes = regexes;
    }

    override filtering(data: { videos: NiconicoVideo[] }): void {
        data.videos = data.videos.filter((video) => {
            const videoId = video.id;
            const userId = video.owner?.id;
            if (userId === undefined) return true;

            const recordVideo = () => {
                this.filteredVideos.set(videoId, video);
                this.blockedCount++;
            };

            // ユーザーIDによるフィルタリング
            if (this.userIds.has(userId)) {
                pushCommonLog(this.log.userId, userId, videoId);
                recordVideo();

                return false;
            }

            // 動画IDによるフィルタリング
            if (this.videoIds.has(videoId)) {
                this.log.videoId.push(videoId);
                recordVideo();

                return false;
            }

            // 正規表現によるフィルタリング
            {
                const target = this.regexes.find(
                    (regex) => regex.test(userId) || regex.test(videoId),
                );
                if (target !== undefined) {
                    pushCommonLog(this.log.regex, target.toString(), videoId);
                    recordVideo();

                    return false;
                }
            }

            return true;
        });
    }

    override isNgVideo(video: NiconicoVideo): boolean {
        const videoId = video.id;
        const userId = video.owner?.id;
        if (userId === undefined) return false;

        if (
            this.userIds.has(userId) ||
            this.videoIds.has(videoId) ||
            this.regexes.some(
                (regex) => regex.test(userId) || regex.test(videoId),
            )
        ) {
            return true;
        }

        return false;
    }

    override sortLog(): void {
        // 正規表現によるフィルタリングのログをソート
        {
            const log: IdLog["regex"] = new Map();

            // フィルター順にソート
            this.regexes.forEach((userId) => {
                const regexStr = userId.toString();
                const value = this.log.regex.get(regexStr);
                if (value !== undefined) {
                    log.set(regexStr, value);
                }
            });

            // 各ルールのコメントをソート
            log.forEach((ids, key) => {
                log.set(key, sortVideoId(ids, this.filteredVideos));
            });

            this.log.regex = log;
        }

        // ユーザーIDによるフィルタリングのログをソート
        {
            const log: IdLog["userId"] = new Map();

            // フィルター順にソート
            this.userIds.forEach((userId) => {
                const value = this.log.userId.get(userId);
                if (value !== undefined) {
                    log.set(userId, value);
                }
            });

            // 各ルールのコメントをソート
            log.forEach((ids, userId) => {
                log.set(userId, sortVideoId(ids, this.filteredVideos));
            });

            this.log.userId = log;
        }

        // 動画IDによるフィルタリングのログをソート
        this.log.videoId = sortVideoId(this.log.videoId, this.filteredVideos);
    }
}

export function formatNgId(
    id: string,
    context: string | undefined,
    settings: Settings,
) {
    return settings.isNgContextAppendedOnAdd && context !== undefined
        ? `${id} # ${context}`
        : id;
}
