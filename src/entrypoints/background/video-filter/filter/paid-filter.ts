import { Filter } from "../filter";
import type { NiconicoVideo } from "@/types/api/niconico-video.types";

export class PaidFilter extends Filter {
    override filtering(data: { videos: NiconicoVideo[] }): void {
        if (!this.settings.isPaidVideoHidden) return;

        data.videos = data.videos.filter((video) => {
            if (video.isPaymentRequired) {
                this.filteredVideos.push({
                    video,
                    target: "paid",
                });

                return false;
            }

            return true;
        });
    }

    override isNgVideo(video: NiconicoVideo): boolean {
        if (!this.settings.isPaidVideoHidden) return false;

        return video.isPaymentRequired;
    }
}
