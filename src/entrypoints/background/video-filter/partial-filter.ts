import type { Video } from "@/types/api/video.types";
import { isString } from "@/utils/util";
import { RuleFilter } from "./rule-filter";
import type { ApplyParams } from "./filter";

export abstract class PartialFilter extends RuleFilter {
  protected abstract pickTarget(video: Video): string | null;

  override apply<T>(params: ApplyParams<T>): void {
    const rules = this.rules;
    if (rules.length === 0) return;

    this.traverseVideos(params, (video) => {
      const target = this.pickTarget(video);
      if (target === null) return true;

      for (const { pattern } of rules) {
        if (
          isString(pattern) ? target.includes(pattern) : pattern.test(target)
        ) {
          this.filteredVideos.push({
            video,
            pattern,
            target: this.target,
          });

          return false;
        }
      }

      return true;
    });
  }
}
