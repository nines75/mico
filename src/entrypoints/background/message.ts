import { texts } from "@/utils/config.js";
import { getLogData, loadSettings } from "@/utils/storage.js";
import { savePlaybackTime, sendNotification } from "@/utils/util.js";
import { Message } from "../content/message.js";
import { addNgUserId } from "./comment-filter/filter/user-id-filter.js";

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
    const userId = logData?.videoData?.log.noToUserId.get(commentNo);
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
        videoId: string;
        commentNo: number;
        specific: boolean;
    };

    const tabId = sender.tab?.id;
    if (tabId === undefined) return;

    const logData = await getLogData(tabId);
    const ngToUserId = logData?.videoData?.log.noToUserId;
    if (ngToUserId === undefined) {
        await sendNotification(texts.background.messageFailedToAddNgUserId);
        return;
    }

    const userId = ngToUserId.get(data.commentNo);
    if (userId === undefined) {
        await sendNotification(texts.background.messageFailedToAddNgUserId);
        return;
    }

    await addNgUserId(
        new Set([data.specific ? `${data.videoId}@${userId}` : userId]),
    );

    const settings = await loadSettings();
    const tasks: Promise<void>[] = [];

    if (settings.isAutoReload) {
        tasks.push(
            browser.tabs.sendMessage(tabId, {
                type: "reload",
                data: tabId,
            }),
        );
    }

    if (settings.isNotifyAddNgUserId) {
        tasks.push(sendNotification(texts.content.messageAddNgUserId));
    }

    await Promise.all(tasks);
}
