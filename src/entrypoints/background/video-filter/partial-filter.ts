import type { Video } from "@/types/api/niconico-video.types";
import { isString } from "@/utils/util";
import { RuleFilter } from "./rule-filter";

export abstract class PartialFilter extends RuleFilter {
    protected abstract pickTarget(video: Video): string | null;

    override apply(data: { videos: Video[] }): void {
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
}
