import type { NiconicoComment, Thread } from "@/types/api/comment.types";
import type { Settings } from "@/types/storage/settings.types";
import type { CommentMap } from "@/types/storage/log-comment.types";
import type { CommonLog } from "@/types/storage/log.types";

export abstract class Filter<T> {
    protected blockedCount = 0;
    protected filteredComments: CommentMap = new Map();
    protected settings: Settings;
    protected abstract log: T;

    constructor(settings: Settings) {
        this.settings = settings;
    }

    abstract filtering(threads: Thread[]): void;
    abstract sortLog(): void;

    getBlockedCount(): number {
        return this.blockedCount;
    }
    getFilteredComments() {
        return this.filteredComments;
    }
    getLog() {
        return this.log;
    }

    traverseThreads(
        threads: Thread[],
        callback: (comment: NiconicoComment, thread: Thread) => boolean,
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

    sortDuplicateLog(currentLog: CommonLog): CommonLog {
        // 重複回数降順にソート
        return new Map(
            [...currentLog].toSorted((a, b) => b[1].length - a[1].length),
        );
    }
}

export function sortCommentId(
    ids: string[],
    comments: CommentMap,
    isSortByScore = false,
): string[] {
    // ソートによって元のデータが破壊されないようにシャローコピーを行う
    // そのままだと元の配列自体の参照が渡されるが、コピーすることで個々のオブジェクトの参照が新たな配列に入るため元のデータが破壊されない
    const idsCopy = [...ids];

    idsCopy.sort((idA, idB) => {
        const a = comments.get(idA) as NiconicoComment;
        const b = comments.get(idB) as NiconicoComment;

        return a.body.localeCompare(b.body);
    });

    if (isSortByScore) {
        idsCopy.sort((idA, idB) => {
            const a = comments.get(idA) as NiconicoComment;
            const b = comments.get(idB) as NiconicoComment;

            return a.score - b.score;
        });
    }

    return idsCopy;
}
