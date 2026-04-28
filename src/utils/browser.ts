import type { Browser } from "#imports";
import type { BackgroundMessage } from "@/entrypoints/background/message";
import type { ContentMessage } from "@/entrypoints/content/message";

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

export async function setBadgeState(
  value: number,
  target: "comment" | "video",
  tabId: number,
) {
  const text = (() => {
    if (value === 0) return "";
    if (value >= 1000) {
      return Math.floor(value / 1000).toString() + "k";
    }

    return value.toString();
  })();
  const color = (() => {
    switch (target) {
      case "comment": {
        return "#b22222";
      }
      case "video": {
        return "#00ffff";
      }
    }
  })();

  await Promise.all([
    browser.browserAction.setBadgeText({ text, tabId }),
    browser.browserAction.setBadgeBackgroundColor({ color, tabId }),
  ]);
}

export async function notify(message: string) {
  await browser.notifications.create({
    type: "basic",
    title: browser.runtime.getManifest().name,
    message,
    iconUrl: browser.runtime.getURL("/icons/128.png"),
  });
}

export async function hasPermission(
  permission: Browser.runtime.ManifestPermission,
) {
  return await browser.permissions.contains({
    permissions: [permission],
  });
}

export async function tryWithPermission(
  permission: Browser.runtime.ManifestPermission,
  callback: () => void | Promise<void>,
) {
  await ((await hasPermission(permission))
    ? callback()
    : notify(`以下の権限が必要です\n\n${permission}`));
}

export async function getActiveTab() {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tabs[0];
}
