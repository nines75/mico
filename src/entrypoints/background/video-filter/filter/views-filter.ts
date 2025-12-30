import type { ViewsLog } from "@/types/storage/log-video.types.js";
import { Filter, sortVideoId } from "../filter.js";
import type { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import type { Settings } from "@/types/storage/settings.types.js";

export class ViewsFilter extends Filter<ViewsLog> {
    private isEnabled: boolean;
    protected override log: ViewsLog = [];

    constructor(settings: Settings, isEnabled: boolean) {
        super(settings);

        this.isEnabled = isEnabled;
    }

    override filtering(data: { videos: NiconicoVideo[] }): void {
        if (!this.isEnabled || !this.settings.isViewsFilterEnabled) return;

        data.videos = data.videos.filter((video) => {
            const views = video.count?.view;
            if (views === undefined) return true;

            if (views <= this.settings.viewsFilterCount) {
                this.log.push(video.id);
                this.filteredVideos.set(video.id, video);
                this.blockedCount++;

                return false;
            }

            return true;
        });
    }

    override isNgVideo(video: NiconicoVideo): boolean {
        if (!this.isEnabled || !this.settings.isViewsFilterEnabled)
            return false;

        const views = video.count?.view;
        if (views === undefined) return false;

        return views <= this.settings.viewsFilterCount;
    }

    override sortLog(): void {
        this.log = sortVideoId(this.log, this.filteredVideos);
    }
}
