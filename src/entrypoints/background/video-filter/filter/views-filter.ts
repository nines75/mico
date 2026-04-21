import { Filter } from "../filter";
import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import type { Settings } from "@/types/storage/settings.types";

export class ViewsFilter extends Filter {
    private isEnabled: boolean;

    constructor(settings: Settings, isEnabled: boolean) {
        super(settings);

        this.isEnabled = isEnabled;
    }

    override filtering(data: { videos: NiconicoVideo[] }): void {
        if (!this.isEnabled || !this.settings.isViewsFilterEnabled) return;

        data.videos = data.videos.filter((video) => {
            const views = video.count.view;
            if (views <= this.settings.viewsFilterCount) {
                this.filteredVideos.push({ video, target: "views" });

                return false;
            }

            return true;
        });
    }
}
