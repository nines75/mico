import type { Thread } from "@/types/api/comment.types";
import { Filter } from "../filter";

export class ScoreFilter extends Filter {
    override apply(threads: Thread[]): void {
        if (!this.settings.enableScoreFilter) return;

        this.traverseThreads(threads, (comment) => {
            const { score } = comment;

            if (score <= this.settings.scoreFilterThreshold) {
                this.filteredComments.push({
                    comment,
                    target: "score",
                });

                return false;
            }

            return true;
        });
    }
}
