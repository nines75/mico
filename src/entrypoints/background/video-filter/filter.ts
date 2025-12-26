import { CommonLog } from "@/types/storage/log.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { isString, pushCommonLog } from "@/utils/util.js";
import { VideoMap } from "@/types/storage/log-video.types.js";
import { CountableFilter, parseFilter, RuleData } from "../filter.js";
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

export abstract class RuleFilter<T>
    extends Filter<T>
    implements CountableFilter
{
    protected invalidCount = 0;
    protected filter: RuleData;

    constructor(settings: Settings, filter: string) {
        super(settings);

        this.filter = this.createFilter(filter);
    }

    getInvalidCount(): number {
        return this.invalidCount;
    }

    createFilter(filter: string): RuleData {
        const { rules, invalid } = parseFilter(filter);
        this.invalidCount += invalid;

        return { rules };
    }

    countRules(): number {
        return this.filter.rules.length;
    }

    createKey(rule: string | RegExp): string {
        return isString(rule) ? rule : rule.toString();
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

            for (const { rule } of this.filter.rules) {
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

        return this.filter.rules.some(({ rule }) =>
            isString(rule) ? target.includes(rule) : rule.test(target),
        );
    }

    override sortLog(): void {
        const log: CommonLog = new Map();

        // フィルター順にソート
        this.filter.rules.forEach(({ rule }) => {
            const key = this.createKey(rule);
            const value = this.log.get(key);
            if (value !== undefined) {
                log.set(key, value);
            }
        });

        // 各ルールのコメントをソート
        log.forEach((ids, rule) => {
            log.set(rule, sortVideoId(ids, this.filteredVideos));
        });

        this.log = log;
    }
}

export function getCountableFilters(
    filters: Filters,
): ConditionalPick<Filters, CountableFilter> {
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
