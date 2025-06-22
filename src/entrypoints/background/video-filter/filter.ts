import { NiconicoVideo, RecommendData } from "@/types/api/recommend.types.js";
import {
    CommonVideoFilterLog,
    NiconicoVideoData,
} from "@/types/storage/log.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { extractRule } from "../comment-filter/filter.js";
import { ConditionalPick } from "type-fest";
import { FilteredData } from "./filter-video.js";

export abstract class Filter<T> {
    protected filteredVideos: NiconicoVideoData = new Map();
    protected settings: Settings;
    protected abstract log: T;

    constructor(settings: Settings) {
        this.settings = settings;
    }

    abstract filtering(recommendData: RecommendData): void;
    abstract isNgVideo(video: NiconicoVideo): boolean;
    abstract getCount(): number;
    abstract sortLog(): void;

    getLog() {
        return this.log;
    }

    getVideos() {
        return this.filteredVideos;
    }
}

export abstract class CommonFilter extends Filter<CommonVideoFilterLog> {
    invalidCount = 0;
    protected abstract filter: RegExp[];
    protected abstract rawFilter: string;
    protected override log: CommonVideoFilterLog = new Map();

    protected abstract getTargetValue(video: NiconicoVideo): string | null;

    getInvalidCount(): number {
        return this.invalidCount;
    }

    override filtering(recommendData: RecommendData): void {
        recommendData.items = recommendData.items.filter((item) => {
            if (item.contentType !== "video") return true;

            const videoId = item.id;
            const target = this.getTargetValue(item.content);
            if (target === null) return true;

            for (const regex of this.filter) {
                const regexStr = regex.toString();

                if (regex.test(target)) {
                    if (this.log.has(regexStr)) {
                        this.log.get(regexStr)?.push(videoId);
                    } else {
                        this.log.set(regexStr, [videoId]);
                    }

                    this.filteredVideos.set(item.id, item.content);

                    return false;
                }
            }

            return true;
        });
    }

    override isNgVideo(video: NiconicoVideo): boolean {
        const target = this.getTargetValue(video);
        if (target === null) return false;

        for (const regex of this.filter) {
            if (regex.test(target)) {
                return true;
            }
        }

        return false;
    }

    override getCount(): number {
        return this.log.values().reduce((sum, ids) => sum + ids.length, 0);
    }

    override sortLog(): void {
        const log: CommonVideoFilterLog = new Map();

        // フィルター昇順にソート
        this.filter.forEach((rule) => {
            const ruleStr = rule.toString();
            if (this.log.has(ruleStr)) {
                log.set(ruleStr, this.log.get(ruleStr) ?? []);
            }
        });

        this.log = log;

        // 各ルールのコメントをソート
        this.log.forEach((ids, rule) => {
            this.log.set(rule, sortVideoId(ids, this.filteredVideos));
        });
    }

    getFilter(): RegExp[] {
        const res: RegExp[] = [];
        extractRule(this.rawFilter).forEach((rule) => {
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

    getRuleCount(): number {
        return this.filter.length;
    }
}

type CommonFilterType = ConditionalPick<FilteredData["filters"], CommonFilter>;

export function getCommonFilters(
    filters: FilteredData["filters"],
): CommonFilterType {
    return {
        userNameFilter: filters.userNameFilter,
        titleFilter: filters.titleFilter,
    };
}

export function sortVideoId(
    ids: string[],
    videos: NiconicoVideoData,
): string[] {
    const idsCopy = [...ids];

    idsCopy.sort((idA, idB) => {
        const a = videos.get(idA) as NiconicoVideo;
        const b = videos.get(idB) as NiconicoVideo;

        return a.title.localeCompare(b.title);
    });

    return idsCopy;
}
