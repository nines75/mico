import { extractRuleFromFilter } from "@/entrypoints/background/comment-filter/filter.js";
import { getNgCommandData } from "@/entrypoints/background/comment-filter/filter/command-filter.js";
import {
    addNgUserId,
    getNgUserIdSet,
    removeNgUserId,
} from "@/entrypoints/background/comment-filter/filter/user-id-filter.js";
import { getNgWordData } from "@/entrypoints/background/comment-filter/filter/word-filter.js";
import { FilterId } from "@/entrypoints/options/components/ui/FilterArea.js";
import { NiconicoComment } from "@/types/api/comment.types.js";
import {
    CommandLog,
    CommentData,
    ScoreLog,
    UserIdLog,
    VideoData,
    VideoLog,
    WordLog,
} from "@/types/storage/log.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { texts } from "@/utils/config.js";
import { useStorageStore } from "@/utils/store.js";
import { escapeNewline } from "@/utils/util.js";
import { JSX } from "react";
import { Fragment } from "react/jsx-runtime";
import { ConditionalPick } from "type-fest";
import { useShallow } from "zustand/shallow";

type LogId = keyof ConditionalPick<
    VideoData["count"]["items"],
    number | undefined
>; // VideoLogには存在しない可能性があるので、必ず値を持つcountのキーを指定する

export interface LogViewerProps {
    id: LogId;
    name: string;
}

export default function LogViewer({ id, name }: LogViewerProps) {
    const [videoLog, count] = useStorageStore(
        useShallow((state) => [
            state.log?.videoData?.log,
            state.log?.videoData?.count,
        ]),
    );

    const settings = useStorageStore.getState().settings;

    // フィルタリングが無効に設定されている場合はレンダリングしない
    if (id === "easyComment" && !settings.isHideEasyComment) return null;
    if (id === "ngScore" && !settings.isScoreFilterEnabled) return null;

    return (
        <section>
            <div className="filtering-type">{name}</div>
            <div>
                {id !== "easyComment" && id !== "ngScore" && (
                    <span className="info">
                        <span>ルール数:</span>
                        <span className="value">
                            {getRuleCount(id, settings)}
                        </span>
                    </span>
                )}
                <span className="info">
                    <span>ブロック数:</span>
                    <span className="value">{count?.items[id] ?? 0}</span>
                </span>
            </div>
            {id === "ngUserId" && (videoLog?.strictNgUserIds.size ?? 0) > 0 && (
                <div>
                    <button
                        title={texts.popup.titleUndoStrictNgUserIds}
                        onClick={async () => {
                            try {
                                await undoStrictNgUserIds(videoLog);
                            } catch (e) {
                                console.error(e);
                            }
                        }}
                    >
                        undo
                    </button>
                </div>
            )}
            {id !== "easyComment" && (
                <div className="log">{getLog(id, videoLog, settings)}</div>
            )}
        </section>
    );
}

async function undoStrictNgUserIds(videoLog: VideoLog | undefined) {
    const userIds = videoLog?.strictNgUserIds ?? new Set();

    if (
        !confirm(
            texts.popup.messageUndoStrictNgUserIds.replace(
                "{target}",
                [...userIds].join("\n"),
            ),
        )
    )
        return;

    await removeNgUserId(userIds);
}

function getRuleCount(rule: FilterId, settings: Settings) {
    switch (rule) {
        case "ngUserId":
            return extractRuleFromFilter(settings.ngUserId).length;
        case "ngCommand":
            return getNgCommandData(settings).rules.length;
        case "ngWord":
            return getNgWordData(settings).rules.length;
    }
}

function getLog(
    id: Exclude<LogId, "easyComment">,
    videoLog: VideoLog | undefined,
    settings: Settings,
) {
    if (videoLog === undefined) return null;

    const comments = videoLog.comments;

    switch (id) {
        case "ngUserId":
            return renderUserIdLog(
                videoLog.ngUserId,
                comments,
                settings,
                videoLog.strictNgUserIds,
            );
        case "ngScore":
            return renderScoreLog(videoLog.ngScore, comments, settings);
        case "ngCommand":
            return renderCommandLog(videoLog.ngCommand, comments, settings);
        case "ngWord":
            return renderWordLog(videoLog.ngWord, comments, settings);
    }
}

function renderUserIdLog(
    userIdLog: UserIdLog,
    comments: CommentData,
    settings: Settings,
    strictNgUserIds?: Set<string>,
) {
    const renderLog = (userId: string, elements: JSX.Element[]) => {
        const onClickUserId = async () => {
            try {
                if (
                    !confirm(
                        texts.popup.messageRemoveNgUserId.replace(
                            "{target}",
                            userId,
                        ),
                    )
                )
                    return;

                await removeNgUserId(new Set([userId]));
            } catch (e) {
                console.error(e);
            }
        };

        elements.push(
            <div key={userId} className="log-line comment">
                {"# "}
                {strictNgUserIds !== undefined &&
                    strictNgUserIds.has(userId) && (
                        <span className="strict-symbol">[!]</span>
                    )}
                <span
                    className="clickable"
                    title={texts.popup.titleRemoveNgUserId}
                    onClick={onClickUserId}
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
    commandLog: CommandLog,
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
                          title: texts.popup.titleAddNgUserId,
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
                title={texts.popup.titleAddNgUserId}
                className="clickable"
                onClick={() => onClickComment(comments)}
            >
                {escapeNewline(body)}
            </span>
        </Fragment>,
    );

    return elements;
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
        alert(texts.popup.messageNgUserIdAlreadyExists);
        return;
    }

    if (
        !confirm(
            texts.popup.messageAddNgUserId.replace(
                "{target}",
                [...targetUserIds].join("\n"),
            ),
        )
    )
        return;

    await addNgUserId(new Set(targetUserIds));
}
