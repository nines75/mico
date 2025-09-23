import { messages } from "@/utils/config.js";
import {
    getLogData,
    loadSettings,
    removeAllData,
    setLog,
    setSettings,
} from "@/utils/storage.js";
import { sendNotification } from "@/utils/util.js";
import { Message } from "../content/message.js";
import {
    addNgUserId,
    removeNgUserId,
} from "./comment-filter/filter/user-id-filter.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import { filterVideo } from "./video-filter/filter-video.js";
import { saveLog } from "./video-filter/save-log.js";
import { Settings } from "@/types/storage/settings.types.js";
import { addNgId, removeNgId } from "./video-filter/filter/id-filter.js";

export async function backgroundMessageHandler(
    message: Message,
    sender: browser.runtime.MessageSender,
) {
    // エラーの発生箇所を出力するためにメッセージ受信側でエラーを出力
    try {
        if (sender.id !== browser.runtime.id) return;

        if (message.type === "save-playback-time") {
            const playbackData = message.data as {
                tabId: number;
                time: number;
            };

            await setLog(
                { playbackTime: playbackData.time },
                playbackData.tabId,
            );
        }
        if (message.type === "save-ng-user-id")
            await saveNgUserId(message, sender);
        if (message.type === "get-user-id") await getUserId(message, sender);
        if (message.type === "filter-old-search")
            await filterOldSearch(message, sender);
        if (message.type === "set-settings")
            await setSettings(message.data as Partial<Settings>);
        if (message.type === "remove-all-data") await removeAllData();
        if (message.type === "add-ng-user-id")
            await addNgUserId(message.data as Set<string>);
        if (message.type === "remove-ng-user-id") {
            const data = message.data as {
                userIds: Set<string>;
                isRemoveSpecific?: boolean;
            };
            await removeNgUserId(data.userIds, data.isRemoveSpecific);
        }
        if (message.type === "add-ng-id") await addNgId(message.data as string);
        if (message.type === "remove-ng-id")
            await removeNgId(message.data as string);
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
    const videoId = log?.videoId ?? undefined;
    const userId = log?.commentFilterLog?.filtering.noToUserId.get(
        data.commentNo,
    );
    if (log === undefined || videoId === undefined || userId === undefined) {
        await sendNotification(messages.ngUserId.additionFailed);
        return;
    }

    await addNgUserId(
        new Set([data.specific ? `${videoId}@${userId}` : userId]),
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

async function filterOldSearch(
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
            type: "remove-old-search",
            data: filteredData.filteredIds satisfies Set<string>,
        }),
    ]);
}
