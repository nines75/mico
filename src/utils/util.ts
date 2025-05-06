import { ProcessingTimeData } from "../types/storage/log.types.js";
import { pattern, colors } from "./config.js";
import { setLog } from "./storage.js";

export function extractVideoId(url: string | undefined) {
    if (url === undefined) return;

    const match = url.match(pattern.regex.extractVideoId);
    if (match === null) return;

    // nullでなければ必ず一つ以上値が入っている
    return match[0];
}

export async function changeBadgeState(text: string, tabId: number) {
    if (text === "0") text = "";

    await Promise.all([
        browser.browserAction.setBadgeText({ text, tabId }),
        browser.browserAction.setBadgeBackgroundColor({
            color: colors.badge,
            tabId,
        }),
    ]);
}

export function escapeNewline(str: string) {
    return str.replace(/\n/g, "\\n");
}

export async function sendNotification(message: string) {
    await browser.notifications.create({
        type: "basic",
        title: browser.runtime.getManifest().name,
        message,
        iconUrl: browser.runtime.getURL("/icons/128.png"),
    });
}

export async function savePlaybackTime(tabId: number, time: number) {
    await setLog({ playbackTime: time }, tabId);
}

export async function saveProcessingTime(
    times: [keyof ProcessingTimeData, number | undefined][],
    tabId: number,
) {
    if (times.length === 0) return;

    const processingTime: ProcessingTimeData = {};
    times.forEach(([key, time]) => {
        processingTime[key] = time ?? -1; // deepmerge-tsだとundefinedで上書きができないのでnullを使う必要があるが、全てのプロパティでnullチェックするのが面倒なので-1を使う
    });

    await setLog({ processingTime }, tabId);
}
