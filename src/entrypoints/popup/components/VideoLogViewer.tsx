import { CommonLog } from "@/types/storage/log.types.js";
import { messages, pattern, titles } from "@/utils/config.js";
import { useStorageStore } from "@/utils/store.js";
import { escapeNewline } from "@/utils/util.js";
import { JSX } from "react";
import { ConditionalPick } from "type-fest";
import { useShallow } from "zustand/shallow";
import { LogFrame } from "./LogFrame.js";
import { formatNgId } from "@/entrypoints/background/video-filter/filter/id-filter.js";
import {
    VideoCount,
    VideoFiltering,
    IdLog,
    VideoData,
} from "@/types/storage/log-video.types.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import { sendMessageToBackground } from "@/entrypoints/background/message.js";
import { keyIn } from "ts-extras";
import { Line, Comment } from "./LogViewer.js";

type LogId = keyof ConditionalPick<VideoCount["blocked"], number>;

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

    const videos = filtering.videos;

    switch (id) {
        case "ngId":
            return renderIdLog(filtering.ngId, videos);
        case "paid":
        case "views":
            return renderVideos(filtering[id], videos, getTitleElement);
        case "ngUserName":
        case "ngTitle":
            return renderCommonLog(filtering[id], videos);
    }
}

// -------------------------------------------------------------------------------------------
// ログをレンダリングする関数
// -------------------------------------------------------------------------------------------

function renderIdLog(log: IdLog, videos: VideoData) {
    const renderUserIdLog = (userId: string, elements: JSX.Element[]) => {
        const videoId = log.userId.get(userId)?.[0] as string;
        const userName = videos.get(videoId)?.owner?.name;

        elements.push(
            <Comment key={userId}>
                {"# "}
                <span
                    className="clickable"
                    title={titles.removeNgUserId}
                    onClick={() => onClickId(userId, "user")}
                >
                    {`${userId}${userName === null || userName === undefined ? "" : `(${userName})`}`}
                </span>
            </Comment>,
            ...renderVideos(log.userId.get(userId), videos, (video) => (
                <span>{escapeNewline(video.title)}</span>
            )),
            <br key={`${userId}-br`} />,
        );
    };
    const elements: JSX.Element[] = [];

    // ユーザーIDによるログを生成
    log.userId.keys().forEach((userId) => {
        renderUserIdLog(userId, elements);
    });

    // 動画IDによるログを生成
    if (log.videoId.length > 0) {
        elements.push(
            <Comment key="video-id-log">{"# 動画ID"}</Comment>,
            ...renderVideos(log.videoId, videos, (video) => (
                <span
                    title={titles.removeNgVideoId}
                    className="clickable"
                    onClick={() => onClickId(video.id, "video")}
                >
                    {escapeNewline(video.title)}
                </span>
            )),
        );
    }

    return elements;
}

function renderCommonLog(log: CommonLog, videos: VideoData) {
    const renderLog = (rule: string, elements: JSX.Element[]) => {
        const ids = log.get(rule) ?? [];

        elements.push(
            <Comment key={rule}>{`# ${rule}`}</Comment>,
            ...renderVideos(ids, videos, getTitleElement),
            <br key={`${rule}-br`} />,
        );
    };

    const elements: JSX.Element[] = [];
    log.keys().forEach((rule) => {
        renderLog(rule, elements);
    });

    return elements;
}

// -------------------------------------------------------------------------------------------
// 重複をまとめる関数
// -------------------------------------------------------------------------------------------

function renderVideos(
    ids: string[] | undefined,
    videos: VideoData,
    getElement: (video: NiconicoVideo) => JSX.Element,
) {
    const elements: JSX.Element[] = [];
    const settings = useStorageStore.getState().settings;

    ids?.forEach((videoId) => {
        const video = videos.get(videoId) as NiconicoVideo;

        elements.push(
            <Line key={videoId}>
                {settings.isTitleRenderedAsLink
                    ? renderVideoLink(video)
                    : getElement(video)}
            </Line>,
        );
    });

    return elements;
}

function renderVideoLink(video: NiconicoVideo) {
    return (
        <a href={`${pattern.watchPageUrl}${video.id}`}>
            {escapeNewline(video.title)}
        </a>
    );
}

function getTitleElement(video: NiconicoVideo) {
    const userId = video.owner?.id;
    const escapedTitle = escapeNewline(video.title);

    return userId === undefined ? (
        <>{escapedTitle}</>
    ) : (
        <span
            title={titles.addNgUserIdByVideo}
            className="clickable"
            onClick={() => onClickVideoTitle(userId, video)}
        >
            {escapedTitle}
        </span>
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
    if (!confirm(text.replace("{target}", id))) return;

    await sendMessageToBackground({
        type: "remove-ng-id",
        data: id,
    });
}

async function onClickVideoTitle(userId: string, video: NiconicoVideo) {
    if (!confirm(messages.ngUserId.confirmAddition.replace("{target}", userId)))
        return;

    const settings = useStorageStore.getState().settings;
    const userName = video.owner?.name ?? undefined;

    await sendMessageToBackground({
        type: "add-ng-id",
        data: formatNgId(userId, userName, settings),
    });
}
