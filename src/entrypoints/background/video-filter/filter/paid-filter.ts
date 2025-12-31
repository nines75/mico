import type { PaidLog } from "@/types/storage/log-video.types.js";
import { Filter, sortVideoId } from "../filter.js";
import type { NiconicoVideo } from "@/types/api/niconico-video.types.js";

export class PaidFilter extends Filter<PaidLog> {
    protected override log: PaidLog = [];

    override filtering(data: { videos: NiconicoVideo[] }): void {
        if (!this.settings.isPaidVideoHidden) return;

        data.videos = data.videos.filter((video) => {
            if (video.isPaymentRequired) {
                this.log.push(video.id);
                this.filteredVideos.set(video.id, video);
                this.blockedCount++;

                return false;
            }

            return true;
        });
    }

    override isNgVideo(video: NiconicoVideo): boolean {
        if (!this.settings.isPaidVideoHidden) return false;

        return video.isPaymentRequired;
    }

    override sortLog(): void {
        this.log = sortVideoId(this.log, this.filteredVideos);
    }
}
