import { colors, messages } from "@/utils/config.js";
import { getLogData, loadSettings } from "@/utils/storage.js";
import {
    changeBadgeState,
    savePlaybackTime,
    sendNotification,
} from "@/utils/util.js";
import { Message } from "../content/message.js";
import { addNgUserId } from "./comment-filter/filter/user-id-filter.js";
import { addNgId } from "./video-filter/filter/id-filter.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import { filterVideo } from "./video-filter/filter-video.js";
import { saveLog } from "./video-filter/save-log.js";

export async function backgroundMessageHandler(
    message: Message,
    sender: browser.runtime.MessageSender,
) {
    try {
        if (sender.id !== browser.runtime.id) return;

        if (message.type === "save-playback-time") {
            const playbackData = message.data as {
                tabId: number;
                time: number;
            };

            await savePlaybackTime(playbackData.tabId, playbackData.time);
        }
        if (message.type === "save-ng-user-id")
            await saveNgUserId(message, sender);
        if (message.type === "get-user-id") await getUserId(message, sender);
        if (message.type === "save-ng-id") await saveNgId(message, sender);
        if (message.type === "restore-video-badge")
            await restoreVideoBadge(sender);
        if (message.type === "filter-search")
            await filterSearch(message, sender);
    } catch (e) {
        console.error(e);
    }
}

async function getUserId(
    message: Message,
    sender: browser.runtime.MessageSender,
) {
    const commentNo = message.data as number;

    const tabId = sender.tab?.id;
    if (tabId === undefined) return;

    const logData = await getLogData(tabId);
    const userId =
        logData?.commentFilterLog?.filtering.noToUserId.get(commentNo);
    if (userId === undefined) return;

    await browser.tabs.sendMessage(tabId, {
        type: "mount-user-id",
        data: userId satisfies string,
    });
}

async function saveNgUserId(
    message: Message,
    sender: browser.runtime.MessageSender,
) {
    const data = message.data as {
        commentNo: number;
        specific: boolean;
    };

    const tabId = sender.tab?.id;
    if (tabId === undefined) return;

    const log = await getLogData(tabId);
    const userId = log?.commentFilterLog?.filtering.noToUserId.get(
        data.commentNo,
    );
    if (log === undefined || log.videoId === null || userId === undefined) {
        await sendNotification(messages.ngUserId.additionFailed);
        return;
    }

    await addNgUserId(
        new Set([data.specific ? `${log.videoId}@${userId}` : userId]),
    );

    const settings = await loadSettings();
    const tasks: Promise<void>[] = [];

    if (settings.isAutoReload) {
        tasks.push(
            browser.tabs.sendMessage(tabId, {
                type: "reload",
                data: tabId satisfies number,
            }),
        );
    }

    if (settings.isNotifyAddNgUserId) {
        tasks.push(sendNotification(messages.ngUserId.additionSuccess));
    }

    await Promise.all(tasks);
}

export interface NgIdMessage {
    video?: {
        id: string;
        title: string;
    };
    userId?: {
        id: string;
        allId: string[];
        userName: string | undefined;
        type: "recommend" | "ranking";
    };
}

async function saveNgId(
    message: Message,
    sender: browser.runtime.MessageSender,
) {
    const data = message.data as NgIdMessage;
    const settings = await loadSettings();

    // 動画IDをNG追加
    if (data.video !== undefined) {
        await addNgId(
            new Set([
                settings.isAddNgContext
                    ? `${data.video.id} # ${data.video.title}`
                    : data.video.id,
            ]),
        );
        return;
    }

    const tabId = sender.tab?.id;
    if (tabId === undefined || data.userId === undefined) return;

    const log = await getLogData(tabId);
    const videoIdToUserId = log?.videoFilterLog?.filtering.videoIdToUserId;
    const userId = videoIdToUserId?.get(data.userId.id);
    if (videoIdToUserId === undefined || userId === undefined) {
        await sendNotification(messages.ngUserId.additionFailed);
        return;
    }

    // ユーザーIDをNG追加
    await addNgId(
        new Set([
            settings.isAddNgContext && data.userId.userName !== undefined
                ? `${userId} # ${data.userId.userName}`
                : userId,
        ]),
    );

    const toRemoveVideoIds = data.userId.allId.filter(
        (id) => videoIdToUserId.get(id) === userId,
    );
    await browser.tabs.sendMessage(tabId, {
        type: `remove-${data.userId.type}`,
        data: toRemoveVideoIds satisfies string[],
    });
}
async function restoreVideoBadge(sender: browser.runtime.MessageSender) {
    const tabId = sender.tab?.id;
    if (tabId === undefined) return;

    const log = await getLogData(tabId);
    const count = log?.videoFilterLog?.count.totalBlocked;
    if (count === undefined) return;

    await changeBadgeState(count, colors.videoBadge, tabId);
}

async function filterSearch(
    message: Message,
    sender: browser.runtime.MessageSender,
) {
    const data = message.data as NiconicoVideo[];
    const settings = await loadSettings();

    const tabId = sender.tab?.id;
    if (tabId === undefined) return;

    const filteredData = filterVideo(data, settings);
    if (filteredData === undefined) return;

    await Promise.all([
        saveLog(filteredData, tabId, true),
        browser.tabs.sendMessage(tabId, {
            type: "remove-search",
            data: filteredData.filteredIds satisfies Set<string>,
        }),
    ]);
}
