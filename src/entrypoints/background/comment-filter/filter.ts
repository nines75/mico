import type { Comment, Thread } from "@/types/api/comment.types";
import type { FilteredComment } from "@/types/storage/log.types";
import type { Settings } from "@/types/storage/settings.types";

export abstract class Filter {
    protected settings: Settings;
    protected filteredComments: FilteredComment[] = [];

    constructor(settings: Settings) {
        this.settings = settings;
    }

    abstract apply(threads: Thread[]): void;

    getFilteredComments() {
        return this.filteredComments;
    }

    traverseThreads(
        threads: Thread[],
        callback: (comment: Comment, thread: Thread) => boolean,
    ) {
        for (const thread of threads) {
            thread.comments = thread.comments.filter((comment): boolean => {
                if (this.settings.isMyCommentIgnored && comment.isMyPost)
                    return true;
                if (
                    this.settings.isIgnoreByNicoru &&
                    comment.nicoruCount >= this.settings.ignoreByNicoruCount
                )
                    return true;

                return callback(comment, thread);
            });
        }
    }
}
