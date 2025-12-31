import type { BackgroundMessage } from "@/entrypoints/background/message.js";
import type { ContentMessage } from "@/entrypoints/content/message.js";

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
