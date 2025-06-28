import {
    addNgUserId,
    getNgUserIdSet,
    removeNgUserId,
} from "@/entrypoints/background/comment-filter/filter/user-id-filter.js";
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
    if (id === "easyComment" && !settings.isHideEasyComment) return null;
    if (id === "ngScore" && !settings.isScoreFilterEnabled) return null;

    const blocked = count?.blocked[id];
    if (blocked === undefined || blocked === 0) return null;

    return (
        <LogFrame
            rule={
                id !== "easyComment" && id !== "ngScore"
                    ? count?.rule[id]
                    : undefined
            }
            {...{ name, blocked }}
        >
            {id === "ngUserId" &&
                (filtering?.strictNgUserIds.size ?? 0) > 0 && (
                    <div>
                        <button
                            title={titles.undoStrict}
                            onClick={() => undoStrictNgUserIds(filtering)}
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

async function undoStrictNgUserIds(filtering: CommentFiltering | undefined) {
    try {
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

        await removeNgUserId(userIds, false); // strictルールで追加したユーザーIDだけを削除したいので、動画限定ルールを除外
    } catch (error) {
        console.error(error);
    }
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
        case "ngScore":
            return renderScoreLog(filtering.ngScore, comments, settings);
        case "ngCommand":
            return renderCommandLog(filtering.ngCommand, comments, settings);
        case "ngWord":
            return renderWordLog(filtering.ngWord, comments, settings);
    }
}

function renderUserIdLog(
    userIdLog: CommonLog,
    comments: CommentData,
    settings: Settings,
    strictNgUserIds?: Set<string>,
) {
    const renderLog = (userId: string, elements: JSX.Element[]) => {
        elements.push(
            <div key={userId} className="log-line comment">
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
            </div>,
        );

        const ids = userIdLog.get(userId) ?? [];
        ids.forEach((commentId) => {
            const comment = comments.get(commentId) as NiconicoComment;

            elements.push(
                <div key={commentId} className="log-line">
                    {formatComment(comment, settings, false)}
                </div>,
            );
        });

        elements.push(<br key={`${userId}-br`} />);
    };

    const elements: JSX.Element[] = [];

    userIdLog.keys().forEach((userId) => {
        renderLog(userId, elements);
    });

    return elements;
}

function renderScoreLog(
    scoreLog: ScoreLog,
    comments: CommentData,
    settings: Settings,
) {
    const elements: JSX.Element[] = [];

    scoreLog.forEach((commentId) => {
        const comment = comments.get(commentId) as NiconicoComment;

        elements.push(
            <div key={commentId} className="log-line">
                {formatComment(
                    comment,
                    {
                        ...settings,
                        ...{ isShowNgScoreInLog: true },
                    },
                    true,
                )}
            </div>,
        );
    });

    return elements;
}

function renderCommandLog(
    commandLog: CommonLog,
    comments: CommentData,
    settings: Settings,
) {
    const renderLog = (command: string, elements: JSX.Element[]) => {
        elements.push(
            <div
                key={command}
                className="log-line comment"
            >{`# ${command}`}</div>,
        );

        const ids = commandLog.get(command) ?? [];
        ids.forEach((commentId) => {
            const comment = comments.get(commentId) as NiconicoComment;

            elements.push(
                <div key={commentId} className="log-line">
                    {formatComment(comment, settings, true)}
                </div>,
            );
        });

        elements.push(<br key={`${command}-br`} />);
    };

    const elements: JSX.Element[] = [];

    commandLog.keys().forEach((command) => {
        renderLog(command, elements);
    });

    return elements;
}

function renderWordLog(
    wordLog: WordLog,
    comments: CommentData,
    settings: Settings,
) {
    const renderLog = (word: string, elements: JSX.Element[]) => {
        elements.push(
            <div key={word} className="log-line comment">{`# ${word}`}</div>,
        );

        const map = wordLog.get(word) ?? new Map<string, string[]>();
        map.keys().forEach((body) => {
            const ids = map.get(body) ?? [];

            elements.push(
                <div key={`${word}-${body}`} className="log-line">
                    {formatCommentWithDuplicate(
                        ids.map((id) => comments.get(id) as NiconicoComment),
                        body,
                        settings,
                    )}
                </div>,
            );
        });

        elements.push(<br key={`${word}-br`} />);
    };

    const elements: JSX.Element[] = [];

    wordLog.keys().forEach((word) => {
        renderLog(word, elements);
    });

    return elements;
}

function formatComment(
    comment: NiconicoComment,
    settings: Settings,
    isClickable: boolean,
) {
    const [body, nicoru, score] = [
        comment.body,
        comment.nicoruCount,
        comment.score,
    ];

    const isNicoru =
        settings.isShowNicoruInLog && nicoru >= settings.showNicoruInLogCount;
    const isNgScore = settings.isShowNgScoreInLog && score < 0;

    const elements: JSX.Element[] = [];

    if (isNgScore) {
        elements.push(
            <span
                key={`ng-score`}
                className="ng-score"
            >{`[🚫:${score}]`}</span>,
        );
    }
    if (isNicoru) {
        elements.push(
            <span key={`nicoru`} className="nicoru">{`[👍:${nicoru}]`}</span>,
        );
    }

    elements.push(
        <Fragment key={`body`}>
            {`${elements.length > 0 ? ":" : ""}`}
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

function formatCommentWithDuplicate(
    comments: NiconicoComment[],
    body: string,
    settings: Settings,
) {
    const elements: JSX.Element[] = [];
    const cnt = comments.length;

    if (
        settings.isShowDuplicateInLog &&
        cnt >= settings.showDuplicateInLogCount
    ) {
        elements.push(
            <span key={`cnt`} className="duplicate">{`[${cnt}回]`}</span>,
        );
    }

    elements.push(
        <Fragment key={`body`}>
            {`${elements.length > 0 ? ":" : ""}`}
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

async function onClickUserId(userId: string) {
    try {
        if (
            !confirm(
                messages.ngUserId.confirmRemoval.replace("{target}", userId),
            )
        )
            return;

        await removeNgUserId(new Set([userId]));
    } catch (e) {
        console.error(e);
    }
}

async function onClickComment(comments: NiconicoComment | NiconicoComment[]) {
    try {
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

        await addNgUserId(new Set(targetUserIds));
    } catch (e) {
        console.error(e);
    }
}
