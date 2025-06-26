import { CommonLog } from "../types/storage/log.types.js";
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

export function countCommonLog(log: CommonLog) {
    return log.values().reduce((sum, array) => sum + array.length, 0);
}
