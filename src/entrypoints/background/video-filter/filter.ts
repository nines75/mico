import { CommonLog } from "@/types/storage/log.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { isString, pushCommonLog } from "@/utils/util.js";
import { VideoMap } from "@/types/storage/log-video.types.js";
import { parseFilter, Rule } from "../filter.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import { Filters } from "./filter-video.js";
import { ConditionalPick } from "type-fest";

export abstract class Filter<T> {
    protected blockedCount = 0;
    protected filteredVideos: VideoMap = new Map();
    protected settings: Settings;
    protected abstract log: T;

    constructor(settings: Settings) {
        this.settings = settings;
    }

    abstract filtering(data: { videos: NiconicoVideo[] }): void;
    abstract isNgVideo(video: NiconicoVideo): boolean;
    abstract sortLog(): void;

    getBlockedCount(): number {
        return this.blockedCount;
    }
    getFilteredVideos() {
        return this.filteredVideos;
    }
    getLog() {
        return this.log;
    }
}

export abstract class RuleFilter<T> extends Filter<T> {
    protected rules: Rule[];
    protected invalidCount = 0;

    constructor(settings: Settings, filter: string) {
        super(settings);

        const { rules, invalidCount } = parseFilter(filter);
        this.rules = rules;
        this.invalidCount += invalidCount;
    }

    getInvalidCount(): number {
        return this.invalidCount;
    }

    countRules(): number {
        return this.rules.length;
    }

    createKey(rule: string | RegExp): string {
        return isString(rule) ? rule : rule.toString();
    }

    sortCommonLog(currentLog: CommonLog, keys: (string | RegExp)[]): CommonLog {
        const log: CommonLog = new Map();

        // フィルター順にソート
        keys.forEach((key) => {
            const keyStr = this.createKey(key);
            const value = currentLog.get(keyStr);
            if (value !== undefined) {
                log.set(keyStr, value);
            }
        });

        // 各キーの動画IDをソート
        log.forEach((ids, key) => {
            log.set(key, sortVideoId(ids, this.filteredVideos));
        });

        return log;
    }
}

export abstract class PartialFilter extends RuleFilter<CommonLog> {
    protected override log: CommonLog = new Map();

    protected abstract pickTarget(video: NiconicoVideo): string | null;

    override filtering(data: { videos: NiconicoVideo[] }): void {
        data.videos = data.videos.filter((video) => {
            const videoId = video.id;
            const target = this.pickTarget(video);
            if (target === null) return true;

            for (const { rule } of this.rules) {
                if (
                    isString(rule) ? target.includes(rule) : rule.test(target)
                ) {
                    pushCommonLog(this.log, this.createKey(rule), videoId);
                    this.filteredVideos.set(videoId, video);
                    this.blockedCount++;

                    return false;
                }
            }

            return true;
        });
    }

    override isNgVideo(video: NiconicoVideo): boolean {
        const target = this.pickTarget(video);
        if (target === null) return false;

        return this.rules.some(({ rule }) =>
            isString(rule) ? target.includes(rule) : rule.test(target),
        );
    }

    override sortLog(): void {
        this.log = this.sortCommonLog(
            this.log,
            this.rules.map(({ rule }) => rule),
        );
    }
}

export function getRuleFilters(
    filters: Filters,
): ConditionalPick<Filters, RuleFilter<unknown>> {
    return {
        idFilter: filters.idFilter,
        userNameFilter: filters.userNameFilter,
        titleFilter: filters.titleFilter,
    };
}

export function sortVideoId(ids: string[], videos: VideoMap): string[] {
    const idsCopy = [...ids];

    idsCopy.sort((idA, idB) => {
        const a = videos.get(idA) as NiconicoVideo;
        const b = videos.get(idB) as NiconicoVideo;

        return a.title.localeCompare(b.title);
    });

    return idsCopy;
}
