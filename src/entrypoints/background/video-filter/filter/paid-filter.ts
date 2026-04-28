import { Filter } from "../filter";
import type { Video } from "@/types/api/video.types";

export class PaidFilter extends Filter {
  override apply(data: { videos: Video[] }): void {
    if (!this.settings.enablePaidFilter) return;

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
