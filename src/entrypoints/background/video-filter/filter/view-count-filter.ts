import { Filter } from "../filter";
import type { Video } from "@/types/api/video.types";
import type { Settings } from "@/types/storage/settings.types";

export class ViewCountFilter extends Filter {
  private isEnabled: boolean;

  constructor(settings: Settings, isEnabled: boolean) {
    super(settings);

    this.isEnabled = isEnabled;
  }

  override apply(data: { videos: Video[] }): void {
    if (!this.isEnabled || !this.settings.enableViewCountFilter) return;

    data.videos = data.videos.filter((video) => {
      const view = video.count.view;
      if (view <= this.settings.viewCountFilterThreshold) {
        this.filteredVideos.push({ video, target: "view-count" });

        return false;
      }

      return true;
    });
  }
}
