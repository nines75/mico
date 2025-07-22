import { CommonLog } from "../types/storage/log.types.js";
import { pattern } from "./config.js";
import { setLog } from "./storage.js";

export function isWatchPage(url: string | undefined) {
    if (url === undefined) return false;

    return url.startsWith(pattern.watchPageUrl);
}

export function isRankingPage(url: string | undefined) {
    if (url === undefined) return false;

    return url.startsWith(pattern.rankingPageUrl);
}

export function isSearchPage(url: string) {
    return (
        url.startsWith(pattern.searchPageUrl) ||
        url.startsWith(pattern.tagSearchPageUrl)
    );
}

export async function changeBadgeState(
    value: number,
    color: string,
    tabId: number,
) {
    const text = value === 0 ? "" : value.toString();

    await Promise.all([
        browser.browserAction.setBadgeText({ text, tabId }),
        browser.browserAction.setBadgeBackgroundColor({ color, tabId }),
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
