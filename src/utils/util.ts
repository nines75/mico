import { Browser } from "#imports";
import { sendMessageToContent } from "@/entrypoints/content/message.js";
import { CommonLog, LogId } from "../types/storage/log.types.js";
import { messages, pattern } from "./config.js";
import { z } from "./zod.js";
import delay from "delay";

export function isNiconicoPage(url: string | undefined) {
    if (url === undefined) return false;

    return url.startsWith(pattern.topPageUrl);
}

export function isWatchPage(url: string | undefined) {
    if (url === undefined) return false;

    return url.startsWith(pattern.watchPageUrl);
}

export function isRankingPage(url: string | undefined) {
    if (url === undefined) return false;

    return url.startsWith(pattern.rankingPageUrl);
}

export function isSearchPage(url: string | undefined) {
    if (url === undefined) return false;

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

export function countCommonLog(log: CommonLog) {
    return log.values().reduce((sum, array) => sum + array.length, 0);
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
    permission: Browser.runtime.ManifestPermissions,
    callback: () => void | Promise<void>,
) {
    const hasPermission = await browser.permissions.contains({
        permissions: [permission],
    });

    if (hasPermission) {
        await callback();
    } else {
        await sendNotification(
            messages.other.permissionRequired.replace("{target}", permission),
        );
    }
}

export function safeParseJson<T>(
    text: string | null | undefined,
    schema: z.ZodType<T>,
): T | undefined {
    try {
        if (text === null || text === undefined) return;

        const data = JSON.parse(text);
        const result = schema.safeParse(data);

        return result.success ? result.data : undefined;
    } catch {
        return;
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

    // スクリプトを実行するタブのhost権限がないとエラーが発生する
    try {
        const res = await browser.tabs.executeScript(tabId, {
            file: "/get-log-id.js",
        });

        return res[0];
    } catch {
        return;
    }
}
