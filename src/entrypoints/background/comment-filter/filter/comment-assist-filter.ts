import { Thread } from "@/types/api/comment.types.js";
import { Filter } from "../filter.js";
import { CommonLog } from "@/types/storage/log.types.js";
import { countCommonLog, pushCommonLog } from "@/utils/util.js";

export class CommentAssistFilter extends Filter<CommonLog> {
    protected log: CommonLog = new Map();

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

                return false;
            }

            return true;
        });
    }

    override countBlocked(): number {
        return countCommonLog(this.log);
    }

    override sortLog(): void {
        const log: CommonLog = new Map();

        // 重複回数降順にソート
        [...this.log]
            .sort((a, b) => b[1].length - a[1].length)
            .forEach(([key, value]) => {
                log.set(key, value);
            });

        this.log = log;
    }
}
