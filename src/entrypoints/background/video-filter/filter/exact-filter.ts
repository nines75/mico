import type { Settings } from "@/types/storage/settings.types";
import { isString } from "@/utils/util";
import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import { RuleFilter } from "../rule-filter";
import type { Rule } from "../../rule";
import type { FilteredVideo } from "@/types/storage/log-video.types";

export abstract class ExactFilter extends RuleFilter {
    private ids = new Set<string>();
    private regexes: RegExp[] = [];

    constructor(
        settings: Settings,
        target: keyof Rule["target"],
        logTarget: FilteredVideo["target"],
    ) {
        super(settings, target, logTarget);

        // Setを複数箇所で使うため予め生成
        for (const { pattern } of this.rules) {
            if (isString(pattern)) {
                this.ids.add(pattern);
            } else {
                this.regexes.push(pattern);
            }
        }
    }

    protected abstract pickTarget(video: NiconicoVideo): string;

    override filtering(data: { videos: NiconicoVideo[] }): void {
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
                    ...(id !== undefined && { id }),
                });

                return false;
            }

            return true;
        });
    }

    override isNgVideo(video: NiconicoVideo): boolean {
        const target = this.pickTarget(video);

        if (
            this.ids.has(target) ||
            this.regexes.some((regex) => regex.test(target))
        ) {
            return true;
        }

        return false;
    }
}
