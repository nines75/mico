import type { ApplyParams } from "../filter";
import { Filter } from "../filter";
import type { Settings } from "@/types/storage/settings.types";

export class ShortsFilter extends Filter {
  private isEnabled: boolean;

  constructor(settings: Settings, isEnabled: boolean) {
    super(settings);

    this.isEnabled = isEnabled;
  }

  override apply<T>(params: ApplyParams<T>): void {
    if (!this.isEnabled || !this.settings.enableShortsFilter) return;

    this.traverseVideos(params, (video) => {
      if (video.contentType === "short") {
        this.filteredVideos.push({ video, target: "shorts" });

        return false;
      }

      return true;
    });
  }
}
