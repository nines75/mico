import { Filter, sortVideoId } from "../filter.js";
import { Settings } from "@/types/storage/settings.types.js";
import { messages, pattern } from "@/utils/config.js";
import { loadSettings, setSettings } from "@/utils/storage.js";
import {
    countCommonLog,
    pushCommonLog,
    sendNotification,
} from "@/utils/util.js";
import { IdLog } from "@/types/storage/log-video.types.js";
import { parseFilter } from "../../filter.js";
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
                pushCommonLog(this.log.userId, userId, videoId);
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

        if (
            (userId !== undefined && this.filter.userIds.has(userId)) ||
            this.filter.videoIds.has(videoId)
        ) {
            return true;
        }

        return false;
    }

    override countBlocked(): number {
        return countCommonLog(this.log.userId) + this.log.videoId.length;
    }

    override sortLog(): void {
        // ユーザーIDによるフィルタリングのログをソート
        {
            const log: IdLog["userId"] = new Map();

            // フィルター順にソート
            this.filter.userIds.forEach((userId) => {
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

    createFilter(): NgIds {
        const rules = parseFilter(this.settings.ngId);
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

    countRules(): number {
        return this.filter.userIds.size + this.filter.videoIds.size;
    }
}

/** background以外からは呼び出さない */
export async function addNgId(id: string) {
    const func = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        return {
            ngId: `${id}\n${settings.ngId}`,
        };
    };

    await setSettings(func);
}

/** background以外からは呼び出さない */
export async function removeNgId(id: string) {
    const func = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        const toRemoveLines = new Set(
            parseFilter(settings.ngId)
                .filter((data) => id === data.rule)
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

export function formatNgId(
    id: string,
    context: string | undefined,
    settings: Settings,
) {
    return settings.isAddNgContext && context !== undefined
        ? `${id} # ${context}`
        : id;
}

/** background以外からは呼び出さない */
export async function addNgIdFromUrl(url: string | undefined) {
    const settings = await loadSettings();
    const id = url?.match(pattern.regex.extractId)?.[1];

    if (id === undefined) {
        await sendNotification(messages.ngId.extractionFailed);
        return;
    }

    await addNgId(id);

    if (settings.isNotifyAddNgId) {
        await sendNotification(
            messages.ngId.additionSuccess.replace("{target}", id),
        );
    }
}
