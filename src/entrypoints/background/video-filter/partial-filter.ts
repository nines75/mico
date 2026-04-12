import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import { isString } from "@/utils/util";
import { RuleFilter } from "./rule-filter";

export abstract class PartialFilter extends RuleFilter {
    protected abstract pickTarget(video: NiconicoVideo): string | null;

    override filtering(data: { videos: NiconicoVideo[] }): void {
        data.videos = data.videos.filter((video) => {
            const target = this.pickTarget(video);
            if (target === null) return true;

            for (const { pattern } of this.rules) {
                if (
                    isString(pattern)
                        ? target.includes(pattern)
                        : pattern.test(target)
                ) {
                    this.filteredVideos.push({
                        video,
                        pattern,
                        target: this.target,
                    });

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
}
