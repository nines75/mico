import { getNgUserIdSet } from "@/entrypoints/background/comment-filter/filter/user-id-filter.js";
import { NiconicoComment } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { messages, titles } from "@/utils/config.js";
import { useStorageStore } from "@/utils/store.js";
import { escapeNewline } from "@/utils/util.js";
import { JSX } from "react";
import { Fragment } from "react/jsx-runtime";
import { ConditionalPick } from "type-fest";
import { useShallow } from "zustand/shallow";
import { LogFrame } from "./LogFrame.js";
import {
    CommentData,
    ScoreLog,
    WordLog,
    CommentCount,
    CommentFiltering,
} from "@/types/storage/log-comment.types.js";
import { CommonLog } from "@/types/storage/log.types.js";
import { sendMessageToBackground } from "@/entrypoints/background/message.js";
import { keyIn } from "ts-extras";
import { Line, Comment } from "./LogViewer.js";

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

    const comments = filtering.comments;

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
    comments: CommentData,
    settings: Settings,
    strictNgUserIds?: Set<string>,
) {
    const renderLog = (userId: string, elements: JSX.Element[]) => {
        elements.push(
            <Comment key={userId}>
                {"# "}
                {strictNgUserIds !== undefined &&
                    strictNgUserIds.has(userId) && (
                        <span className="strict-symbol">[!]</span>
                    )}
                <span
                    className="clickable"
                    title={titles.removeNgUserId}
                    onClick={() => onClickUserId(userId)}
                >
                    {userId}
                </span>
            </Comment>,
        );

        const ids = log.get(userId);
        ids?.forEach((commentId) => {
            const comment = comments.get(commentId) as NiconicoComment;

            elements.push(
                <Line key={commentId}>
                    {formatComment(comment, settings, false)}
                </Line>,
            );
        });

        elements.push(<br key={`${userId}-br`} />);
    };
    const elements: JSX.Element[] = [];

    log.keys().forEach((userId) => {
        renderLog(userId, elements);
    });

    return elements;
}

function renderCommentAssistLog(
    log: CommonLog,
    comments: CommentData,
    settings: Settings,
) {
    const elements: JSX.Element[] = [];

    log.forEach((ids, body) => {
        elements.push(
            <Line key={body}>
                {formatDuplicateComment(
                    ids.map((id) => comments.get(id) as NiconicoComment),
                    body,
                    {
                        ...settings,
                        ...{
                            isDuplicateVisible: true,
                            duplicateVisibleCount: 2,
                        },
                    },
                )}
            </Line>,
        );
    });

    return elements;
}

function renderScoreLog(
    log: ScoreLog,
    comments: CommentData,
    settings: Settings,
) {
    const elements: JSX.Element[] = [];

    log.forEach((commentId) => {
        const comment = comments.get(commentId) as NiconicoComment;

        elements.push(
            <Line key={commentId}>
                {formatComment(
                    comment,
                    {
                        ...settings,
                        ...{ isNgScoreVisible: true },
                    },
                    true,
                )}
            </Line>,
        );
    });

    return elements;
}

function renderCommandLog(
    log: CommonLog,
    comments: CommentData,
    settings: Settings,
) {
    const renderLog = (command: string, elements: JSX.Element[]) => {
        elements.push(<Comment key={command}>{`# ${command}`}</Comment>);

        const ids = log.get(command);
        ids?.forEach((commentId) => {
            const comment = comments.get(commentId) as NiconicoComment;

            elements.push(
                <Line key={commentId}>
                    {formatComment(comment, settings, true)}
                </Line>,
            );
        });

        elements.push(<br key={`${command}-br`} />);
    };
    const elements: JSX.Element[] = [];

    log.keys().forEach((command) => {
        renderLog(command, elements);
    });

    return elements;
}

function renderWordLog(
    log: WordLog,
    comments: CommentData,
    settings: Settings,
) {
    const renderLog = (word: string, elements: JSX.Element[]) => {
        elements.push(<Comment key={word}>{`# ${word}`}</Comment>);

        const map = log.get(word);
        map?.forEach((ids, body) => {
            elements.push(
                <Line key={`${word}-${body}`}>
                    {formatDuplicateComment(
                        ids.map((id) => comments.get(id) as NiconicoComment),
                        body,
                        settings,
                    )}
                </Line>,
            );
        });

        elements.push(<br key={`${word}-br`} />);
    };
    const elements: JSX.Element[] = [];

    log.keys().forEach((word) => {
        renderLog(word, elements);
    });

    return elements;
}

// -------------------------------------------------------------------------------------------
// 行をレンダリングする関数
// -------------------------------------------------------------------------------------------

function formatComment(
    comment: NiconicoComment,
    settings: Settings,
    isClickable: boolean,
) {
    const elements: JSX.Element[] = [];
    const [body, nicoru, score] = [
        comment.body,
        comment.nicoruCount,
        comment.score,
    ];

    const isNicoru =
        settings.isNicoruVisible && nicoru >= settings.nicoruVisibleCount;
    const isNgScore = settings.isNgScoreVisible && score < 0;

    if (isNgScore) {
        elements.push(
            <span
                key="ng-score"
                className="ng-score"
                title={titles.ngScore}
            >{`[🚫:${score}]`}</span>,
        );
    }
    if (isNicoru) {
        elements.push(
            <span
                key="nicoru"
                className="nicoru"
                title={titles.nicoruCount}
            >{`[👍:${nicoru}]`}</span>,
        );
    }

    elements.push(
        <Fragment key="body">
            {elements.length > 0 ? ":" : ""}
            <span
                {...(isClickable
                    ? {
                          title: titles.addNgUserIdByComment,
                          className: "clickable",
                          onClick: () => onClickComment(comment),
                      }
                    : {})}
            >
                {escapeNewline(body)}
            </span>
        </Fragment>,
    );

    return elements;
}

function formatDuplicateComment(
    comments: NiconicoComment[],
    body: string,
    settings: Settings,
) {
    const elements: JSX.Element[] = [];
    const cnt = comments.length;

    if (settings.isDuplicateVisible && cnt >= settings.duplicateVisibleCount) {
        elements.push(
            <span
                key="cnt"
                className="duplicate"
                title={titles.duplicateComments}
            >{`[${cnt}回]`}</span>,
        );
    }

    elements.push(
        <Fragment key="body">
            {elements.length > 0 ? ":" : ""}
            <span
                title={titles.addNgUserIdByComment}
                className="clickable"
                onClick={() => onClickComment(comments)}
            >
                {escapeNewline(body)}
            </span>
        </Fragment>,
    );

    return elements;
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
