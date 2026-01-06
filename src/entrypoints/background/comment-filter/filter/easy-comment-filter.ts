import type { Thread } from "@/types/api/comment.types";
import { Filter } from "../filter";
import type { CommonLog } from "@/types/storage/log.types";
import { pushCommonLog } from "@/utils/util";

export class EasyCommentFilter extends Filter<CommonLog> {
    protected override log: CommonLog = new Map();

    override filtering(threads: Thread[]): void {
        if (!this.settings.isEasyCommentHidden) return;

        this.traverseThreads(threads, (comment, thread) => {
            const { id, body } = comment;

            if (thread.fork === "easy") {
                pushCommonLog(this.log, body, id);
                this.filteredComments.set(id, comment);
                this.blockedCount++;

                return false;
            }

            return true;
        });
    }

    override sortLog(): void {
        this.log = this.sortDuplicateLog(this.log);
    }
}
