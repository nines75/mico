import type { BackgroundMessage } from "@/entrypoints/background/message.js";

export async function sendMessageToBackground(
    message: BackgroundMessage,
): Promise<unknown> {
    return await browser.runtime.sendMessage(message);
}
