import H2 from "../ui/H2";
import { useSettingsStore } from "@/utils/store";
import type { Backup } from "@/types/storage/backup.types";
import { getSettings, getSettingsMeta } from "@/utils/storage";
import type { ChangeEvent } from "react";
import { useRef } from "react";
import type { SectionsItem } from "../ui/CheckboxSection";
import Sections from "../ui/CheckboxSection";
import { catchAsync } from "@/utils/util";
import { proxy } from "@/utils/proxy";
import { BrushCleaning, Download, RotateCcw, Upload } from "lucide-react";

const ICON_SIZE = 18;

export default function General() {
  const input = useRef<HTMLInputElement | null>(null);

  return (
    <div className="tab-content">
      <Sections sections={config} />
      <H2 name="バックアップ">
        <button className="button" onClick={() => input.current?.click()}>
          <Download size={ICON_SIZE} />
          インポート
        </button>
        <button className="button" onClick={catchAsync(exportBackup)}>
          <Upload size={ICON_SIZE} />
          エクスポート
        </button>
        <input
          type="file"
          accept=".json"
          style={{ display: "none" }}
          ref={input}
          onChange={catchAsync(importBackup)}
        />
      </H2>
      <H2 name="ストレージ">
        <button
          className="button"
          onClick={catchAsync(async () => {
            if (!confirm("不要な設定やログを削除します。")) return;

            await proxy.cleanUp();
          })}
        >
          <BrushCleaning size={ICON_SIZE} />
          クリーンアップ
        </button>
        <button
          className="button"
          onClick={catchAsync(async () => {
            if (!confirm("全ての設定とログを削除します。")) return;

            await proxy.reset();
          })}
        >
          <RotateCcw size={ICON_SIZE} />
          リセット
        </button>
      </H2>
    </div>
  );
}

async function importBackup(event: ChangeEvent<HTMLInputElement>) {
  const saveSettings = useSettingsStore.getState().saveSettings;
  const text = await event.target.files?.[0]?.text();
  if (text === undefined) return;

  const backup = JSON.parse(text) as Backup;
  if (backup.settings === undefined) return;

  if (backup.settingsMeta !== undefined) {
    await proxy.setSettingsMeta(backup.settingsMeta);
  }

  saveSettings(backup.settings, proxy.migrateSettings);
}

async function exportBackup() {
  const [settings, settingsMeta] = await Promise.all([
    getSettings(),
    getSettingsMeta(),
  ]);

  const backup: Required<Backup> = {
    settings,
    settingsMeta,
  };
  const backupStr = JSON.stringify(backup);

  const blob = new Blob([backupStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const fileName = `${browser.runtime.getManifest().name}-backup.json`;

  // downloads権限なしでダウンロード
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

const config = [
  {
    heading: "エディター",
    items: [
      {
        type: "checkbox",
        id: "enableCloseBrackets",
        label: "括弧を自動で閉じる",
      },
      {
        type: "checkbox",
        id: "enableHighlightTrailingWhitespace",
        label: "行末の空白文字をハイライトする",
      },
    ],
  },
  {
    heading: "通知",
    items: [
      {
        type: "checkbox",
        id: "notifyOnManualNg",
        label: "手動でNG登録した際に通知する",
      },
      {
        type: "checkbox",
        id: "notifyOnAutoNg",
        label: "自動でNG登録した際に通知する",
      },
    ],
  },
  {
    heading: "その他",
    items: [
      {
        type: "checkbox",
        id: "showAdvancedFeatures",
        label: "高度な機能を表示する",
      },
    ],
  },
] satisfies SectionsItem;
