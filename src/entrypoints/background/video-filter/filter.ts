import { CommonLog } from "@/types/storage/log.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { countCommonLog } from "@/utils/util.js";
import { VideoData } from "@/types/storage/log-video.types.js";
import { extractRule } from "../filter.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";

export abstract class Filter<T> {
    protected invalidCount = 0;
    protected filteredVideos: VideoData = new Map();
    protected settings: Settings;
    protected abstract log: T;

    constructor(settings: Settings) {
        this.settings = settings;
    }

    abstract filtering(data: { videos: NiconicoVideo[] }): void;
    abstract isNgVideo(video: NiconicoVideo): boolean;
    abstract getCount(): number;
    abstract sortLog(): void;

    getInvalidCount(): number {
        return this.invalidCount;
    }

    getLog() {
        return this.log;
    }

    getVideos() {
        return this.filteredVideos;
    }
}

export abstract class CommonFilter extends Filter<CommonLog> {
    protected abstract filter: RegExp[];
    protected abstract rawFilter: string;
    protected override log: CommonLog = new Map();

    protected abstract getTargetValue(video: NiconicoVideo): string | null;

    override filtering(data: { videos: NiconicoVideo[] }): void {
        data.videos = data.videos.filter((video) => {
            const videoId = video.id;
            const target = this.getTargetValue(video);
            if (target === null) return true;

            for (const regex of this.filter) {
                const regexStr = regex.source;

                if (regex.test(target)) {
                    if (this.log.has(regexStr)) {
                        this.log.get(regexStr)?.push(videoId);
                    } else {
                        this.log.set(regexStr, [videoId]);
                    }

                    this.filteredVideos.set(video.id, video);

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
        return countCommonLog(this.log);
    }

    override sortLog(): void {
        const log: CommonLog = new Map();

        // フィルター昇順にソート
        this.filter.forEach((rule) => {
            const ruleStr = rule.source;
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

    createFilter(): RegExp[] {
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

export function sortVideoId(ids: string[], videos: VideoData): string[] {
    const idsCopy = [...ids];

    idsCopy.sort((idA, idB) => {
        const a = videos.get(idA) as NiconicoVideo;
        const b = videos.get(idB) as NiconicoVideo;

        return a.title.localeCompare(b.title);
    });

    return idsCopy;
}
