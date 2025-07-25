import { CommonLog } from "@/types/storage/log.types.js";
import { messages, titles } from "@/utils/config.js";
import { useStorageStore } from "@/utils/store.js";
import { escapeNewline } from "@/utils/util.js";
import { JSX } from "react";
import { ConditionalPick } from "type-fest";
import { useShallow } from "zustand/shallow";
import { LogFrame } from "./LogFrame.js";
import {
    addNgId,
    removeNgId,
} from "@/entrypoints/background/video-filter/filter/id-filter.js";
import {
    VideoCount,
    VideoFiltering,
    IdLog,
    VideoData,
} from "@/types/storage/log-video.types.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";

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
        <LogFrame rule={count?.rule[id]} {...{ name, blocked }}>
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
        case "ngUserName":
            return renderCommonLog(filtering.ngUserName, videos);
        case "ngTitle":
            return renderCommonLog(filtering.ngTitle, videos);
    }
}

function renderIdLog(idLog: IdLog, videos: VideoData) {
    const renderUserIdLog = (userId: string, elements: JSX.Element[]) => {
        const sampleVideo = videos.get(
            idLog.userId.get(userId)?.[0] as string,
        ) as NiconicoVideo;
        const userName = sampleVideo.owner?.name;

        elements.push(
            <div key={userId} className="log-line comment">
                {"# "}
                <span
                    className="clickable"
                    title={titles.removeNgUserId}
                    onClick={() => onClickId(userId, "user")}
                >
                    {`${userId}${userName === null || userName === undefined ? "" : `(${userName})`}`}
                </span>
            </div>,
        );

        const ids = idLog.userId.get(userId) ?? [];
        ids.forEach((videoId) => {
            const video = videos.get(videoId) as NiconicoVideo;

            elements.push(
                <div key={videoId} className="log-line">
                    <span>{escapeNewline(video.title)}</span>
                </div>,
            );
        });

        elements.push(<br key={`${userId}-br`} />);
    };

    const elements: JSX.Element[] = [];

    // ユーザーIDのによるログを生成
    idLog.userId.keys().forEach((userId) => {
        renderUserIdLog(userId, elements);
    });

    // 動画IDによるログを生成
    if (idLog.videoId.length > 0) {
        elements.push(
            <div key="video-id-log" className="log-line comment">
                {"# 動画ID"}
            </div>,
        );

        idLog.videoId.forEach((videoId) => {
            const video = videos.get(videoId) as NiconicoVideo;

            elements.push(
                <div key={videoId} className="log-line">
                    <span
                        title={titles.removeNgVideoId}
                        className="clickable"
                        onClick={() => onClickId(videoId, "video")}
                    >
                        {escapeNewline(video.title)}
                    </span>
                </div>,
            );
        });
    }

    return elements;
}

function renderCommonLog(commonLog: CommonLog, videos: VideoData) {
    const renderLog = (rule: string, elements: JSX.Element[]) => {
        elements.push(
            <div key={rule} className="log-line comment">{`# ${rule}`}</div>,
        );

        const ids = commonLog.get(rule) ?? [];
        ids.forEach((videoId) => {
            const video = videos.get(videoId) as NiconicoVideo;
            const escapedTitle = escapeNewline(video.title);
            const userId = video.owner?.id;

            elements.push(
                <div key={videoId} className="log-line">
                    {userId === undefined ? (
                        escapedTitle
                    ) : (
                        <span
                            title={titles.addNgUserIdByVideo}
                            className="clickable"
                            onClick={() => onClickVideoTitle(userId)}
                        >
                            {escapedTitle}
                        </span>
                    )}
                </div>,
            );
        });

        elements.push(<br key={`${rule}-br`} />);
    };

    const elements: JSX.Element[] = [];
    commonLog.keys().forEach((rule) => {
        renderLog(rule, elements);
    });

    return elements;
}

async function onClickId(id: string, type: "user" | "video") {
    try {
        const text = (() => {
            switch (type) {
                case "user":
                    return messages.ngUserId.confirmRemoval;
                case "video":
                    return messages.ngVideoId.confirmRemoval;
            }
        })();

        if (!confirm(text.replace("{target}", id))) return;

        await removeNgId(new Set([id]));
    } catch (e) {
        console.error(e);
    }
}

async function onClickVideoTitle(userId: string) {
    try {
        if (
            !confirm(
                messages.ngUserId.confirmAddition.replace("{target}", userId),
            )
        )
            return;

        await addNgId(new Set([userId]));
    } catch (e) {
        console.error(e);
    }
}
