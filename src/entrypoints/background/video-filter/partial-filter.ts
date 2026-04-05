import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import type { CommonLog } from "@/types/storage/log.types";
import { isString, pushCommonLog } from "@/utils/util";
import { RuleFilter } from "./rule-filter";

export abstract class PartialFilter extends RuleFilter<CommonLog> {
    protected override log: CommonLog = new Map();

    protected abstract pickTarget(video: NiconicoVideo): string | null;

    override filtering(data: { videos: NiconicoVideo[] }): void {
        data.videos = data.videos.filter((video) => {
            const videoId = video.id;
            const target = this.pickTarget(video);
            if (target === null) return true;

            for (const { pattern } of this.rules) {
                if (
                    isString(pattern)
                        ? target.includes(pattern)
                        : pattern.test(target)
                ) {
                    pushCommonLog(this.log, this.createKey(pattern), videoId);
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

        return this.rules.some(({ pattern }) =>
            isString(pattern) ? target.includes(pattern) : pattern.test(target),
        );
    }

    override sortLog(): void {
        this.log = this.sortCommonLog(
            this.log,
            this.rules.map(({ pattern }) => pattern),
        );
    }
}
