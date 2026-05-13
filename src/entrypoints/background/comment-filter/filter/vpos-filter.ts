import type { Thread } from "@/types/api/comment-api.types";
import { Filter } from "../filter";
import type { Settings } from "@/types/storage/settings.types";

export class VposFilter extends Filter {
  private duration: number;

  constructor(settings: Settings, duration: number) {
    super(settings);

    this.duration = duration;
  }

  override apply(threads: Thread[]): void {
    if (!this.settings.enableVposFilter) return;

    this.traverseThreads(threads, (comment) => {
      const { vposMs } = comment;

      if (Math.floor(vposMs / 1000) > this.duration) {
        this.filteredComments.push({
          comment,
          target: "vpos",
        });

        return false;
      }

      return true;
    });
  }
}
