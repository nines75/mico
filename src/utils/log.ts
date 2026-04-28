import type { LogId } from "@/types/storage/log.types";
import delay from "delay";
import { getActiveTab, sendMessageToContent, notify } from "./browser";

export function createLogId() {
  return crypto.randomUUID();
}

export async function mountLogId(logId: LogId, tabId: number) {
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

export async function openLog() {
  const tab = await getActiveTab();
  const logId = await getLogId(tab?.id);
  if (logId === undefined) {
    await notify("ログIDが抽出できませんでした");
    return;
  }

  await browser.windows.create({
    url: [`log.html?id=${logId}`],
    type: "popup",
    titlePreface: "ログ",
    height: 800,
    width: 1300,
  });
}
