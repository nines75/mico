import { Thread } from "@/types/api/comment.types.js";
import { Filter, sortCommentId } from "../filter.js";
import { ScoreLog } from "@/types/storage/log-comment.types.js";

export class ScoreFilter extends Filter<ScoreLog> {
    protected log: ScoreLog = [];

    override filtering(threads: Thread[]): void {
        if (!this.settings.isScoreFilterEnabled) return;

        threads.forEach((thread) => {
            thread.comments = thread.comments.filter((comment) => {
                if (this.isIgnoreByNicoru(comment)) return true;

                const { id, score } = comment;

                if (score <= this.settings.scoreFilterCount) {
                    this.log.push(id);
                    this.filteredComments.set(id, comment);

                    return false;
                }

                return true;
            });
        });
    }

    override sortLog(): void {
        this.log = sortCommentId(this.log, this.filteredComments, true);
    }

    override getCount(): number {
        return this.log.length;
    }
}
