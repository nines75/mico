// -------------------------------------------------------------------------------------------
// 実装方針: https://github.com/nines75/mico/issues/41
// -------------------------------------------------------------------------------------------

import type { Thread } from "@/types/api/comment.types";
import { Filter } from "../filter";

// コメントアシスト機能のリリース日は2025/02/26
// https://blog.nicovideo.jp/niconews/243601.html
const RELEASE_DATE = new Date("2025-02-26T00:00:00+09:00");

export class CommentAssistFilter extends Filter {
    override apply(threads: Thread[]): void {
        if (!this.settings.isCommentAssistFilterEnabled) return;

        this.traverseThreads(threads, (comment, thread) => {
            if (thread.fork === "owner") return true;

            const { commands, postedAt } = comment;

            const date = new Date(postedAt);
            if (Number.isNaN(date.getTime())) return true; // 有効なDateであるか確認

            if (commands.length === 0 && date >= RELEASE_DATE) {
                this.filteredComments.push({
                    comment,
                    target: "comment-assist",
                });

                return false;
            }

            return true;
        });
    }
}
