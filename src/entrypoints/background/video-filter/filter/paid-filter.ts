import { Filter } from "../filter";
import type { NiconicoVideo } from "@/types/api/niconico-video.types";

export class PaidFilter extends Filter {
    override apply(data: { videos: NiconicoVideo[] }): void {
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
}
