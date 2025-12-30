import type { ContentMessage } from "@/entrypoints/content/message.js";

export async function sendMessageToContent(
    tabId: number,
    message: ContentMessage,
): Promise<unknown> {
    return await browser.tabs.sendMessage(tabId, message);
}
