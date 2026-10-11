import type { Settings } from "@/types/storage/settings.types";
import { tryWithPermission, notify, sendNativeMessage } from "./browser";

export async function updateLocalFilter(settings: Settings) {
  if (!settings.updateLocalFilterOnMigration) return;

  await tryWithPermission("nativeMessaging", async () => {
    if (settings.localFilterPath === "") {
      await notify("パスが設定されていません");
      return;
    }

    const response = await sendNativeMessage({
      type: "updateLocalFilter",
      path: settings.localFilterPath,
      filter: settings.manualFilter,
    });

    if (response?.status === "completed") {
      await notify("ローカルフィルターを更新しました");
    }
  });
}
