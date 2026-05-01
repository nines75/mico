import type { ApplyParams } from "../filter";
import { Filter } from "../filter";

export class PaidFilter extends Filter {
  override apply<T>(params: ApplyParams<T>): void {
    if (!this.settings.enablePaidFilter) return;

    this.traverseVideos(params, (video) => {
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
