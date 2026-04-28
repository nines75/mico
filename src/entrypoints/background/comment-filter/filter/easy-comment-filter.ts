import type { Thread } from "@/types/api/comment-api.types";
import { Filter } from "../filter";

export class EasyCommentFilter extends Filter {
  override apply(threads: Thread[]): void {
    if (!this.settings.enableEasyCommentFilter) return;

    this.traverseThreads(threads, (comment, thread) => {
      if (thread.fork === "easy") {
        this.filteredComments.push({
          comment,
          target: "easy-comment",
        });

        return false;
      }

      return true;
    });
  }
}
