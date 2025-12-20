import { Browser } from "#imports";
import { sendMessageToContent } from "@/entrypoints/content/message.js";
import { CommonLog, LogId } from "../types/storage/log.types.js";
import { messages } from "./config.js";
import delay from "delay";

export function isNiconicoPage(url: string | undefined) {
    if (url === undefined) return false;

    return url.startsWith("https://www.nicovideo.jp/");
}

export function isWatchPage(url: string | undefined) {
    if (url === undefined) return false;

    return url.startsWith("https://www.nicovideo.jp/watch/");
}

export function isRankingPage(url: string | undefined) {
    if (url === undefined) return false;

    return (
        url.startsWith("https://www.nicovideo.jp/ranking") &&
        !url.startsWith("https://www.nicovideo.jp/ranking/custom")
    );
}

export function isSearchPage(url: string | undefined) {
    if (url === undefined) return false;

    return (
        url.startsWith("https://www.nicovideo.jp/search/") ||
        url.startsWith("https://www.nicovideo.jp/tag/")
    );
}

export async function changeBadgeState(
    value: number,
    color: string,
    tabId: number,
) {
    const text = (() => {
        if (value === 0) return "";
        if (value >= 1000) {
            return Math.floor(value / 1000).toString() + "k";
        }

        return value.toString();
    })();

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

export function pushCommonLog(log: CommonLog, key: string, value: string) {
    const array = log.get(key);
    if (array !== undefined) {
        array.push(value);
    } else {
        log.set(key, [value]);
    }
}

export async function tryWithPermission(
    permission: Browser.runtime.ManifestPermission,
    callback: () => void | Promise<void>,
) {
    const hasPermission = await browser.permissions.contains({
        permissions: [permission],
    });

    if (hasPermission) {
        await callback();
    } else {
        await sendNotification(
            replace(messages.other.permissionRequired, [permission]),
        );
    }
}

export function createLogId() {
    return crypto.randomUUID();
}

export async function tryMountLogId(logId: LogId, tabId: number) {
    const mount = async () => {
        try {
            await sendMessageToContent(tabId, {
                type: "mount-log-id",
                data: logId,
            });
        } catch {
            await delay(1);
            await mount();
        }
    };
    await mount();
}

export async function getLogId(
    tabId: number | undefined,
): Promise<string | undefined> {
    if (tabId === undefined) return;

    // host権限がないタブではエラーが発生する
    try {
        return (await sendMessageToContent(tabId, {
            type: "get-log-id",
        })) as string | undefined;
    } catch {
        return;
    }
}

export function sumNumbers(numbers: number[]) {
    return numbers.reduce((sum, num) => sum + num, 0);
}

export function replace(text: string, placeholders: string[]) {
    return placeholders.reduce(
        (prev, current, index) => prev.replace(`$${index + 1}`, current),
        text,
    );
}

export function catchAsync<T extends unknown[]>(
    fn: (...args: T) => Promise<void>,
) {
    return (...args: T): void => {
        fn(...args).catch(console.error);
    };
}
