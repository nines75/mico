import { Thread } from "@/types/api/comment.types.js";
import { Filter, sortCommentId } from "../filter.js";
import { ScoreLog } from "@/types/storage/log-comment.types.js";

export class ScoreFilter extends Filter<ScoreLog> {
    protected log: ScoreLog = [];

    override filtering(threads: Thread[]): void {
        if (!this.settings.isScoreFilterEnabled) return;

        threads.forEach((thread) => {
            thread.comments = thread.comments.filter((comment) => {
                if (
                    this.settings.isIgnoreByNicoru &&
                    comment.nicoruCount >= this.settings.IgnoreByNicoruCount
                )
                    return true;

                if (comment.score <= this.settings.scoreFilterCount) {
                    this.log.push(comment.id);
                    this.filteredComments.set(comment.id, comment);

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
