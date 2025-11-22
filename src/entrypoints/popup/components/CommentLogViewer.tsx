import { getNgUserIdSet } from "@/entrypoints/background/comment-filter/filter/user-id-filter.js";
import { NiconicoComment } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { messages, titles } from "@/utils/config.js";
import { useStorageStore } from "@/utils/store.js";
import { escapeNewline } from "@/utils/util.js";
import { ConditionalPick } from "type-fest";
import { useShallow } from "zustand/shallow";
import { LogFrame } from "./LogFrame.js";
import {
    CommentMap,
    ScoreLog,
    WordLog,
    CommentCount,
    CommentFiltering,
} from "@/types/storage/log-comment.types.js";
import { CommonLog } from "@/types/storage/log.types.js";
import { sendMessageToBackground } from "@/entrypoints/background/message.js";
import { keyIn } from "ts-extras";
import { Line, Block, Clickable } from "./LogViewer.js";

type LogId = keyof ConditionalPick<CommentCount["blocked"], number>;

export interface CommentLogViewerProps {
    id: LogId;
    name: string;
}

export default function CommentLogViewer({ id, name }: CommentLogViewerProps) {
    const [filtering, count] = useStorageStore(
        useShallow((state) => [
            state.log?.commentFilterLog?.filtering,
            state.log?.commentFilterLog?.count,
        ]),
    );

    const settings = useStorageStore.getState().settings;

    // フィルタリングが無効に設定されている場合はレンダリングしない
    if (
        (id === "easyComment" && !settings.isEasyCommentHidden) ||
        (id === "commentAssist" && !settings.isCommentAssistFilterEnabled) ||
        (id === "ngScore" && !settings.isScoreFilterEnabled)
    )
        return null;

    const blocked = count?.blocked[id];
    if (blocked === undefined || blocked === 0) return null;

    return (
        <LogFrame
            rule={
                count?.rule !== undefined &&
                keyIn(count.rule, id) &&
                count.rule[id]
            }
            {...{ name, blocked }}
        >
            {id === "ngUserId" &&
                (filtering?.strictNgUserIds.size ?? 0) > 0 && (
                    <div>
                        <button
                            title={titles.undoStrict}
                            className="common-button"
                            onClick={() => undoStrict(filtering)}
                        >
                            undo
                        </button>
                    </div>
                )}
            {id !== "easyComment" && (
                <div className="log">
                    <Log {...{ id, filtering, settings }} />
                </div>
            )}
        </LogFrame>
    );
}

interface LogProps {
    id: Exclude<LogId, "easyComment">;
    filtering: CommentFiltering | undefined;
    settings: Settings;
}

function Log({ id, filtering, settings }: LogProps) {
    if (filtering === undefined) return null;

    const comments = filtering.filteredComments;

    switch (id) {
        case "ngUserId":
            return renderUserIdLog(
                filtering.ngUserId,
                comments,
                settings,
                filtering.strictNgUserIds,
            );
        case "commentAssist":
            return renderCommentAssistLog(
                filtering.commentAssist,
                comments,
                settings,
            );
        case "ngScore":
            return renderScoreLog(filtering.ngScore, comments, settings);
        case "ngCommand":
            return renderCommandLog(filtering.ngCommand, comments, settings);
        case "ngWord":
            return renderWordLog(filtering.ngWord, comments, settings);
    }
}

// -------------------------------------------------------------------------------------------
// ログをレンダリングする関数
// -------------------------------------------------------------------------------------------

function renderUserIdLog(
    log: CommonLog,
    comments: CommentMap,
    settings: Settings,
    strictNgUserIds?: Set<string>,
) {
    return log
        .keys()
        .map((userId) => (
            <Block
                key={userId}
                comment={
                    <>
                        {"# "}
                        {strictNgUserIds?.has(userId) === true && (
                            <span className="strict-symbol">[!]</span>
                        )}
                        <Clickable
                            title={titles.removeNgUserId}
                            onClick={() => onClickUserId(userId)}
                        >
                            {userId}
                        </Clickable>
                    </>
                }
            >
                {renderComments(log.get(userId), comments, settings, false)}
            </Block>
        ))
        .toArray();
}

function renderCommentAssistLog(
    log: CommonLog,
    comments: CommentMap,
    settings: Settings,
) {
    return renderDuplicateComments(log, comments, {
        ...settings,
        ...{
            isDuplicateVisible: true,
            duplicateVisibleCount: 2,
        },
    });
}

function renderScoreLog(
    log: ScoreLog,
    comments: CommentMap,
    settings: Settings,
) {
    return renderComments(
        log,
        comments,
        { ...settings, ...{ isNgScoreVisible: true } },
        true,
    );
}

function renderCommandLog(
    log: CommonLog,
    comments: CommentMap,
    settings: Settings,
) {
    return log
        .keys()
        .map((command) => (
            <Block key={command} comment={`# ${command}`}>
                {renderComments(log.get(command), comments, settings, true)}
            </Block>
        ))
        .toArray();
}

function renderWordLog(log: WordLog, comments: CommentMap, settings: Settings) {
    return log
        .keys()
        .map((word) => (
            <Block key={word} comment={`# ${word}`}>
                {renderDuplicateComments(log.get(word), comments, settings)}
            </Block>
        ))
        .toArray();
}

// -------------------------------------------------------------------------------------------
// 重複をまとめる関数
// -------------------------------------------------------------------------------------------

function renderComments(
    log: string[] | undefined,
    comments: CommentMap,
    settings: Settings,
    isClickable: boolean,
) {
    return log?.map((id) => (
        <Line key={id}>
            {formatComment(
                comments.get(id) as NiconicoComment,
                settings,
                isClickable,
            )}
        </Line>
    ));
}

function renderDuplicateComments(
    log: CommonLog | undefined,
    comments: CommentMap,
    settings: Settings,
) {
    return log
        ?.entries()
        .map(([body, ids]) => (
            <Line key={body}>
                {formatDuplicateComment(
                    ids.map((id) => comments.get(id) as NiconicoComment),
                    body,
                    settings,
                )}
            </Line>
        ))
        .toArray();
}

// -------------------------------------------------------------------------------------------
// 行をレンダリングする関数
// -------------------------------------------------------------------------------------------

function formatComment(
    comment: NiconicoComment,
    settings: Settings,
    isClickable: boolean,
) {
    const { body, score, nicoruCount: nicoru } = comment;
    const escapedBody = escapeNewline(body);

    const isNgScore = settings.isNgScoreVisible && score < 0;
    const isNicoru =
        settings.isNicoruVisible && nicoru >= settings.nicoruVisibleCount;

    return (
        <>
            {isNgScore && (
                <span className="ng-score" title={titles.ngScore}>
                    {`[🚫:${score}]`}
                </span>
            )}
            {isNicoru && (
                <span className="nicoru" title={titles.nicoruCount}>
                    {`[👍:${nicoru}]`}
                </span>
            )}
            {isClickable ? (
                <Clickable
                    title={titles.addNgUserIdByComment}
                    onClick={() => onClickComment(comment)}
                >
                    {escapedBody}
                </Clickable>
            ) : (
                escapedBody
            )}
        </>
    );
}

function formatDuplicateComment(
    comments: NiconicoComment[],
    body: string,
    settings: Settings,
) {
    const cnt = comments.length;
    const isDuplicate =
        settings.isDuplicateVisible && cnt >= settings.duplicateVisibleCount;

    return (
        <>
            {isDuplicate && (
                <span className="duplicate" title={titles.duplicateComments}>
                    {`[${cnt}回]`}
                </span>
            )}
            <Clickable
                title={titles.addNgUserIdByComment}
                onClick={() => onClickComment(comments)}
            >
                {escapeNewline(body)}
            </Clickable>
        </>
    );
}

// -------------------------------------------------------------------------------------------
// コールバック関数
// -------------------------------------------------------------------------------------------

async function undoStrict(filtering: CommentFiltering | undefined) {
    const userIds = filtering?.strictNgUserIds ?? new Set();
    if (
        !confirm(
            messages.ngUserId.undoStrict.replace(
                "{target}",
                [...userIds].join("\n"),
            ),
        )
    )
        return;

    await sendMessageToBackground({
        type: "remove-ng-user-id",
        data: {
            userIds,
            isRemoveSpecific: false, // strictルールで追加したユーザーIDだけを削除したいので、動画限定ルールを除外
        },
    });
}

async function onClickUserId(userId: string) {
    if (!confirm(messages.ngUserId.confirmRemoval.replace("{target}", userId)))
        return;

    await sendMessageToBackground({
        type: "remove-ng-user-id",
        data: {
            userIds: new Set([userId]),
        },
    });
}

async function onClickComment(comments: NiconicoComment | NiconicoComment[]) {
    // 最新の設定を取得
    const settings = useStorageStore.getState().settings;

    const ngUserIds = getNgUserIdSet(settings, ""); // 動画限定ルールではないNGユーザーIDを取得
    const targetUserIds = new Set(
        (Array.isArray(comments) ? comments : [comments])
            .filter((comment) => !ngUserIds.has(comment.userId))
            .map((comment) => comment.userId),
    );

    if (targetUserIds.size === 0) {
        alert(messages.ngUserId.alreadyAdded);
        return;
    }

    if (
        !confirm(
            messages.ngUserId.confirmAddition.replace(
                "{target}",
                [...targetUserIds].join("\n"),
            ),
        )
    )
        return;

    await sendMessageToBackground({
        type: "add-ng-user-id",
        data: targetUserIds,
    });
}
