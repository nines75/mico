import { isString } from "@/utils/util";
import type { Video } from "@/types/api/video.types";
import { RuleFilter } from "./rule-filter";
import type { ApplyParams } from "./filter";

export abstract class ExactFilter extends RuleFilter {
  protected abstract pickTarget(video: Video): string;

  override apply<T>(params: ApplyParams<T>): void {
    const rules = this.rules;
    if (rules.length === 0) return;

    this.traverseVideos(params, (video) => {
      const target = this.pickTarget(video);

      for (const { pattern, id } of rules) {
        if (isString(pattern) ? target !== pattern : !pattern.test(target))
          continue;

        this.filteredVideos.push({
          video,
          pattern,
          target: this.target,
          ...(id !== undefined && { ruleId: id }),
        });

        return false;
      }

      return true;
    });
  }
}
