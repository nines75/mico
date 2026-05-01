import type { ApplyParams } from "../filter";
import { Filter } from "../filter";
import type { Settings } from "@/types/storage/settings.types";

export class ViewCountFilter extends Filter {
  private isEnabled: boolean;

  constructor(settings: Settings, isEnabled: boolean) {
    super(settings);

    this.isEnabled = isEnabled;
  }

  override apply<T>(params: ApplyParams<T>): void {
    if (!this.isEnabled || !this.settings.enableViewCountFilter) return;

    this.traverseVideos(params, (video) => {
      const view = video.count.view;
      if (view <= this.settings.viewCountFilterThreshold) {
        this.filteredVideos.push({ video, target: "view-count" });

        return false;
      }

      return true;
    });
  }
}
