import type { LogId } from "@/types/storage/log.types";
import delay from "delay";
import { sendMessageToContent } from "./browser";

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
