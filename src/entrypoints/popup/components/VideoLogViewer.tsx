import { CommonLog } from "@/types/storage/log.types.js";
import { messages, titles } from "@/utils/config.js";
import { useStorageStore } from "@/utils/store.js";
import { catchAsync, escapeNewline, replace } from "@/utils/util.js";
import { JSX } from "react";
import { useShallow } from "zustand/shallow";
import { LogFrame } from "./LogFrame.js";
import { formatNgId } from "@/entrypoints/background/video-filter/filter/id-filter.js";
import {
    VideoFiltering,
    IdLog,
    VideoMap,
} from "@/types/storage/log-video.types.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import { sendMessageToBackground } from "@/entrypoints/background/message.js";
import { keyIn } from "ts-extras";
import { Line, Block, Clickable } from "./LogViewer.js";
import { Filters } from "@/entrypoints/background/video-filter/filter-video.js";

type LogId = keyof Filters;

export interface VideoLogViewerProps {
    id: LogId;
    name: string;
}

export default function VideoLogViewer({ id, name }: VideoLogViewerProps) {
    const [filtering, count] = useStorageStore(
        useShallow((state) => [
            state.log?.videoFilterLog?.filtering,
            state.log?.videoFilterLog?.count,
        ]),
    );

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
            <div className="log">
                <Log {...{ id, filtering }} />
            </div>
        </LogFrame>
    );
}

interface LogProps {
    id: LogId;
    filtering: VideoFiltering | undefined;
}

function Log({ id, filtering }: LogProps) {
    if (filtering === undefined) return null;

    const videos = filtering.filteredVideos;

    switch (id) {
        case "idFilter":
            return renderIdLog(filtering.filters.idFilter, videos);
        case "paidFilter":
        case "viewsFilter":
            return renderVideos(filtering.filters[id], videos, getTitleElement);
        case "userNameFilter":
        case "titleFilter":
            return renderCommonLog(filtering.filters[id], videos);
    }
}

// -------------------------------------------------------------------------------------------
// ログをレンダリングする関数
// -------------------------------------------------------------------------------------------

function renderIdLog(log: IdLog, videos: VideoMap) {
    const renderRegexLog = (regex: string) => {
        return (
            <Block key={regex} comment={`# ${regex}`}>
                {renderVideos(log.regex.get(regex), videos, (video) => (
                    <span>{escapeNewline(video.title)}</span>
                ))}
            </Block>
        );
    };
    const renderUserIdLog = (userId: string) => {
        const videoId = log.userId.get(userId)?.[0] as string;
        const userName = videos.get(videoId)?.owner?.name;

        return (
            <Block
                key={userId}
                comment={
                    <>
                        {"# "}
                        <Clickable
                            title={titles.removeNgUserId}
                            onClick={catchAsync(() =>
                                onClickId(userId, "user"),
                            )}
                        >
                            {`${userId}${userName === null || userName === undefined ? "" : `(${userName})`}`}
                        </Clickable>
                    </>
                }
            >
                {renderVideos(log.userId.get(userId), videos, (video) => (
                    <span>{escapeNewline(video.title)}</span>
                ))}
            </Block>
        );
    };

    return (
        <>
            {
                // 正規表現によるログを生成
                log.regex
                    .keys()
                    .map((regex) => renderRegexLog(regex))
                    .toArray()
            }
            {
                // ユーザーIDによるログを生成
                log.userId
                    .keys()
                    .map((userId) => renderUserIdLog(userId))
                    .toArray()
            }
            {
                // 動画IDによるログを生成
                log.videoId.length > 0 && (
                    <Block comment={"# 動画ID"}>
                        {renderVideos(log.videoId, videos, (video) => (
                            <Clickable
                                title={titles.removeNgVideoId}
                                onClick={catchAsync(() =>
                                    onClickId(video.id, "video"),
                                )}
                            >
                                {escapeNewline(video.title)}
                            </Clickable>
                        ))}
                    </Block>
                )
            }
        </>
    );
}

function renderCommonLog(log: CommonLog, videos: VideoMap) {
    return log
        .keys()
        .map((rule) => (
            <Block key={rule} comment={`# ${rule}`}>
                {renderVideos(log.get(rule), videos, getTitleElement)}
            </Block>
        ))
        .toArray();
}

// -------------------------------------------------------------------------------------------
// 重複をまとめる関数
// -------------------------------------------------------------------------------------------

function renderVideos(
    ids: string[] | undefined,
    videos: VideoMap,
    getElement: (video: NiconicoVideo) => JSX.Element | string,
) {
    const settings = useStorageStore.getState().settings;

    return ids?.map((videoId) => {
        const video = videos.get(videoId) as NiconicoVideo;

        return (
            <Line key={videoId}>
                {settings.isTitleRenderedAsLink
                    ? renderVideoLink(video)
                    : getElement(video)}
            </Line>
        );
    });
}

function renderVideoLink(video: NiconicoVideo) {
    return (
        <a href={`https://www.nicovideo.jp/watch/${video.id}`}>
            {escapeNewline(video.title)}
        </a>
    );
}

function getTitleElement(video: NiconicoVideo) {
    const userId = video.owner?.id;
    const escapedTitle = escapeNewline(video.title);

    return userId === undefined ? (
        escapedTitle
    ) : (
        <Clickable
            title={titles.addNgUserIdByVideo}
            onClick={catchAsync(() => onClickVideoTitle(userId, video))}
        >
            {escapedTitle}
        </Clickable>
    );
}

// -------------------------------------------------------------------------------------------
// コールバック関数
// -------------------------------------------------------------------------------------------

async function onClickId(id: string, type: "user" | "video") {
    const text = (() => {
        switch (type) {
            case "user":
                return messages.ngUserId.confirmRemoval;
            case "video":
                return messages.ngVideoId.confirmRemoval;
        }
    })();
    if (!confirm(replace(text, [id]))) return;

    await sendMessageToBackground({
        type: "remove-ng-id",
        data: id,
    });
}

async function onClickVideoTitle(userId: string, video: NiconicoVideo) {
    if (!confirm(replace(messages.ngUserId.confirmAddition, [userId]))) return;

    const settings = useStorageStore.getState().settings;
    const userName = video.owner?.name ?? undefined;

    await sendMessageToBackground({
        type: "add-ng-id",
        data: formatNgId(userId, userName, settings),
    });
}
