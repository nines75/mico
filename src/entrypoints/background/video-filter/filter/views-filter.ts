import { Filter } from "../filter";
import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import type { Settings } from "@/types/storage/settings.types";

export class ViewCountFilter extends Filter {
    private isEnabled: boolean;

    constructor(settings: Settings, isEnabled: boolean) {
        super(settings);

        this.isEnabled = isEnabled;
    }

    override apply(data: { videos: NiconicoVideo[] }): void {
        if (!this.isEnabled || !this.settings.isViewsFilterEnabled) return;

        data.videos = data.videos.filter((video) => {
            const view = video.count.view;
            if (view <= this.settings.viewsFilterCount) {
                this.filteredVideos.push({ video, target: "view-count" });

                return false;
            }

            return true;
        });
    }
}
