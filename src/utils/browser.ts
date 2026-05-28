import type { Browser } from "#imports";
import { getSettings, getSettingsMeta, loadSettings } from "./storage";
import type { Backup } from "@/types/storage/backup.types";

export async function setBadgeState(
  value: number,
  tabId: number,
  target: "comment" | "video",
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
  onGranted: () => void | Promise<void>,
) {
  await ((await hasPermission(permission))
    ? onGranted()
    : notify(`以下の権限が必要です\n\n${permission}`));
}

export async function getActiveTab() {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tabs[0];
}

export async function sendNativeMessage(message: unknown) {
  const errorMessage = "ネイティブメッセージング中にエラーが発生しました\n\n";

  try {
    const response = (await browser.runtime.sendNativeMessage(
      "mico.native",
      message,
    )) as
      | {
          status: "completed";
          data?: unknown;
        }
      | {
          status: "failed";
          error: string;
        }
      | {
          status: "skipped";
        };

    if (response.status === "failed") {
      const error = response.error;

      await notify(`${errorMessage}${error}`);
      console.error(error);
    }

    return response;
  } catch (error) {
    // ネイティブメッセージングホストがインストールされていない場合などにエラーが発生する

    await notify(`${errorMessage}${String(error)}`);
    console.error(error);
  }
}

export async function saveBackup(type: "startup" | "shortcut") {
  const settings = await loadSettings();
  if (type === "startup" && !settings.saveBackupOnStartup) return;

  const [rawSettings, meta] = await Promise.all([
    getSettings(),
    getSettingsMeta(),
  ]);
  const { manualFilter, ...rawSettingsWithoutManualFilter } = rawSettings;

  await tryWithPermission("nativeMessaging", async () => {
    if (settings.backupPath === "") {
      await notify("パスが設定されていません");
      return;
    }

    const backup: Required<Backup> = {
      settings: settings.saveBackupWithoutManualFilter
        ? rawSettingsWithoutManualFilter
        : rawSettings,
      settingsMeta: meta,
    };

    const response = await sendNativeMessage({
      type: "saveBackup",
      path: settings.backupPath,
      shouldCheckInterval:
        type === "startup" && settings.saveBackupOnlyAfterInterval,
      intervalThreshold: settings.backupIntervalThreshold,
      backup,
    });

    if (type === "shortcut" && response?.status === "completed") {
      await notify("バックアップを保存しました");
    }
  });
}
