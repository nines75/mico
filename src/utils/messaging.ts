import type { LogId } from "@/types/storage/log.types";
import { defineExtensionMessaging } from "@webext-core/messaging";
import delay from "delay";
import { getActiveTab } from "./browser";
import { isWatchPage } from "./util";

interface ProtocolMap {
  reload(): void;
  getLogId(): string | undefined;
  mountLogId(logId: LogId): void;
  setPlaybackTime(data: number): void;
  prompt(message: string): string | null;
}

const messanger = defineExtensionMessaging<ProtocolMap>();

// unbound-methodエラー回避のためにbindする
export const sendMessage = messanger.sendMessage.bind(messanger);
export const onMessage = messanger.onMessage.bind(messanger);

// -------------------------------------------------------------------------------------------
// ラッパー関数
// 既に同名の関数が存在する場合は末尾にViaMessageを付ける
// -------------------------------------------------------------------------------------------

export async function reloadViaMessage() {
  const tab = await getActiveTab();
  const tabId = tab?.id;
  if (tabId === undefined || !isWatchPage(tab?.url)) return;

  await sendMessage("reload", undefined, tabId);
}

export async function getLogIdViaMessage(
  tabId: number | undefined,
): Promise<string | undefined> {
  if (tabId === undefined) return;

  // host権限がないタブではエラーが発生する
  try {
    return await sendMessage("getLogId", undefined, tabId);
  } catch {
    return;
  }
}

export async function mountLogId(logId: LogId, tabId: number) {
  const mount = async () => {
    try {
      await sendMessage("mountLogId", logId, tabId);
    } catch {
      await delay(1);
      await mount();
    }
  };
  await mount();
}
