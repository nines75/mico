import { Thread } from "@/types/api/comment.types.js";
import { Filter } from "../filter.js";
import { CommonLog } from "@/types/storage/log.types.js";
import { countCommonLog, pushCommonLog } from "@/utils/util.js";

export class EasyCommentFilter extends Filter<CommonLog> {
    protected log: CommonLog = new Map();

    override filtering(threads: Thread[]): void {
        if (!this.settings.isEasyCommentHidden) return;

        this.traverseThreads(threads, (comment, thread) => {
            const { id, body } = comment;

            if (thread.fork === "easy") {
                pushCommonLog(this.log, body, id);
                this.filteredComments.set(id, comment);

                return false;
            }

            return true;
        });
    }

    override countBlocked(): number {
        return countCommonLog(this.log);
    }

    override sortLog(): void {
        this.log = this.sortDuplicateLog(this.log);
    }
}
