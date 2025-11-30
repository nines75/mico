import { CommonLog } from "@/types/storage/log.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { pushCommonLog } from "@/utils/util.js";
import { VideoMap } from "@/types/storage/log-video.types.js";
import { CountableFilter, parseFilter } from "../filter.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import { Filters } from "./filter-video.js";
import { ConditionalPick } from "type-fest";

export abstract class Filter<T> {
    protected blockedCount = 0;
    protected invalidCount = 0;
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
    getInvalidCount(): number {
        return this.invalidCount;
    }
    getFilteredVideos() {
        return this.filteredVideos;
    }
    getLog() {
        return this.log;
    }
}

export abstract class CommonFilter
    extends Filter<CommonLog>
    implements CountableFilter
{
    protected abstract filter: RegExp[];
    protected abstract rawFilter: string;
    protected override log: CommonLog = new Map();

    protected abstract pickTarget(video: NiconicoVideo): string | null;

    override filtering(data: { videos: NiconicoVideo[] }): void {
        data.videos = data.videos.filter((video) => {
            const videoId = video.id;
            const target = this.pickTarget(video);
            if (target === null) return true;

            for (const regex of this.filter) {
                const regexStr = regex.source;

                if (regex.test(target)) {
                    pushCommonLog(this.log, regexStr, videoId);
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

        for (const regex of this.filter) {
            if (regex.test(target)) {
                return true;
            }
        }

        return false;
    }

    override sortLog(): void {
        const log: CommonLog = new Map();

        // フィルター順にソート
        this.filter.forEach((rule) => {
            const ruleStr = rule.source;
            const value = this.log.get(ruleStr);
            if (value !== undefined) {
                log.set(ruleStr, value);
            }
        });

        // 各ルールのコメントをソート
        log.forEach((ids, rule) => {
            log.set(rule, sortVideoId(ids, this.filteredVideos));
        });

        this.log = log;
    }

    createFilter(): RegExp[] {
        const res: RegExp[] = [];
        parseFilter(this.rawFilter).forEach((rule) => {
            try {
                res.push(
                    this.settings.isCaseInsensitive
                        ? RegExp(rule.rule, "i")
                        : RegExp(rule.rule),
                );
            } catch {
                this.invalidCount++;
            }
        });

        return res;
    }

    countRules(): number {
        return this.filter.length;
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
