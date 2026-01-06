import type { Thread } from "@/types/api/comment.types";
import { Filter, sortCommentId } from "../filter";
import type { ScoreLog } from "@/types/storage/log-comment.types";

export class ScoreFilter extends Filter<ScoreLog> {
    protected override log: ScoreLog = [];

    override filtering(threads: Thread[]): void {
        if (!this.settings.isScoreFilterEnabled) return;

        this.traverseThreads(threads, (comment) => {
            const { id, score } = comment;

            if (score <= this.settings.scoreFilterCount) {
                this.log.push(id);
                this.filteredComments.set(id, comment);
                this.blockedCount++;

                return false;
            }

            return true;
        });
    }

    override sortLog(): void {
        this.log = sortCommentId(this.log, this.filteredComments, true);
    }
}
