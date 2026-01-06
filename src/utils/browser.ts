import type { Browser } from "#imports";
import type { BackgroundMessage } from "@/entrypoints/background/message";
import type { ContentMessage } from "@/entrypoints/content/message";
import { replace } from "./util";
import { messages } from "./config";

export async function sendMessageToBackground(
    message: BackgroundMessage,
): Promise<unknown> {
    return await browser.runtime.sendMessage(message);
}

export async function sendMessageToContent(
    tabId: number,
    message: ContentMessage,
): Promise<unknown> {
    return await browser.tabs.sendMessage(tabId, message);
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

export async function sendNotification(message: string) {
    await browser.notifications.create({
        type: "basic",
        title: browser.runtime.getManifest().name,
        message,
        iconUrl: browser.runtime.getURL("/icons/128.png"),
    });
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
