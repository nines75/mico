import type { CommonLog } from "@/types/storage/log.types";
import { messages, titles } from "@/utils/config";
import { useStorageStore } from "@/utils/store";
import { catchAsync, escapeNewline, replace } from "@/utils/util";
import type { JSX } from "react";
import { useShallow } from "zustand/shallow";
import { LogFrame } from "./LogFrame";
import { formatNgId } from "@/entrypoints/background/video-filter/filter/id-filter";
import type {
    VideoFiltering,
    IdLog,
    VideoMap,
} from "@/types/storage/log-video.types";
import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import { keyIn } from "ts-extras";
import { Line, Block, Clickable } from "./LogViewer";
import type { Filters } from "@/entrypoints/background/video-filter/filter-video";
import { sendMessageToBackground } from "@/utils/browser";

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
    const renderRegexLog = (key: string) => {
        return (
            <Block key={key} comment={`# ${key}`}>
                {renderVideos(log.regex.get(key), videos, ({ title }) => (
                    <span>{escapeNewline(title)}</span>
                ))}
            </Block>
        );
    };
    const renderUserIdLog = (key: string) => {
        const videoId = log.userId.get(key)?.[0] as string;
        const userName = videos.get(videoId)?.owner?.name;

        return (
            <Block
                key={key}
                comment={
                    <>
                        {"# "}
                        <Clickable
                            title={titles.removeNgUserId}
                            onClick={catchAsync(() => onClickId(key, "user"))}
                        >
                            {`${key}${userName === null || userName === undefined ? "" : `(${userName})`}`}
                        </Clickable>
                    </>
                }
            >
                {renderVideos(log.userId.get(key), videos, ({ title }) => (
                    <span>{escapeNewline(title)}</span>
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
                    .map((key) => renderRegexLog(key))
                    .toArray()
            }
            {
                // ユーザーIDによるログを生成
                log.userId
                    .keys()
                    .map((key) => renderUserIdLog(key))
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
        .map((key) => (
            <Block key={key} comment={`# ${key}`}>
                {renderVideos(log.get(key), videos, getTitleElement)}
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

    return ids?.map((id) => {
        const video = videos.get(id) as NiconicoVideo;

        return (
            <Line key={id}>
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
    const userName = video.owner?.name;

    await sendMessageToBackground({
        type: "add-ng-id",
        data: formatNgId(userId, userName, settings),
    });
}
