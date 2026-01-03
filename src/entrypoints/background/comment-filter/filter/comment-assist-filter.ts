import type { Thread } from "@/types/api/comment.types.js";
import { Filter } from "../filter.js";
import type { CommonLog } from "@/types/storage/log.types.js";
import { pushCommonLog } from "@/utils/util.js";

export class CommentAssistFilter extends Filter<CommonLog> {
    protected override log: CommonLog = new Map();

    override filtering(threads: Thread[]): void {
        if (!this.settings.isCommentAssistFilterEnabled) return;

        this.traverseThreads(threads, (comment, thread) => {
            if (thread.fork === "owner") return true;

            const { id, commands, postedAt, body } = comment;

            const releaseDate = new Date("2025-02-26T00:00:00+09:00"); // https://blog.nicovideo.jp/niconews/243601.html
            const date = new Date(postedAt);
            if (Number.isNaN(date.getTime())) return true; // 有効なDateであるか確認

            if (commands.length === 0 && date >= releaseDate) {
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
