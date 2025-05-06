import { NiconicoComment } from "@/types/api/comment.types.js";
import { CommentData } from "@/types/storage/log.types.js";

export function sortCommentId(
    ids: string[],
    comments: CommentData,
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
