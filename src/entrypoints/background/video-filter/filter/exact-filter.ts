import { isString } from "@/utils/util";
import type { Video } from "@/types/api/niconico-video.types";
import { RuleFilter } from "../rule-filter";

export abstract class ExactFilter extends RuleFilter {
    protected abstract pickTarget(video: Video): string;

    override apply(data: { videos: Video[] }): void {
        data.videos = data.videos.filter((video) => {
            const target = this.pickTarget(video);

            for (const { pattern, id } of this.rules) {
                if (
                    isString(pattern)
                        ? target !== pattern
                        : !pattern.test(target)
                )
                    continue;

                this.filteredVideos.push({
                    video,
                    pattern,
                    target: this.target,
                    ...(id !== undefined && { ruleId: id }),
                });

                return false;
            }

            return true;
        });
    }
}
