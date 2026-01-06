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
