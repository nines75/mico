import { defaultSettings } from "@/utils/config";
import H2 from "../ui/H2";
import { useStorageStore } from "@/utils/store";
import type { Backup } from "@/types/storage/backup.types";
import type { Settings } from "@/types/storage/settings.types";
import { getSettings } from "@/utils/storage";
import type { ValueOf } from "type-fest";
import type { ChangeEvent } from "react";
import { useRef } from "react";
import { useShallow } from "zustand/shallow";
import type { CheckboxGroups } from "../ui/CheckboxSection";
import CheckboxSection from "../ui/CheckboxSection";
import { catchAsync } from "@/utils/util";
import { notify, sendMessage } from "@/utils/browser";
import { objectKeys } from "ts-extras";
import type { CheckboxProps } from "../ui/Checkbox";
import Checkbox from "../ui/Checkbox";

export default function General() {
  const input = useRef<HTMLInputElement | null>(null);
  const [showAdvancedFeatures, localFilterPath, save] = useStorageStore(
    useShallow((state) => [
      state.settings.showAdvancedFeatures,
      state.settings.localFilterPath,
      state.saveSettings,
    ]),
  );

  const clickInput = () => {
    if (input.current !== null) input.current.click();
  };

  const buttons = [
    ["インポート", clickInput],
    ["エクスポート", catchAsync(exportBackup)],
    ["リセット", catchAsync(reset)],
  ] as const;

  return (
    <div className="tab-content">
      <CheckboxSection groups={config.groups}>
        {showAdvancedFeatures && (
          <>
            {config.children.map((props) => (
              <Checkbox key={props.id} {...props} />
            ))}
            <div className="setting">
              <label className="setting-label">
                {"インポートするローカルフィルターのパス"}
                <input
                  className="input"
                  value={localFilterPath}
                  onChange={(event) => {
                    save({
                      localFilterPath: event.target.value,
                    });
                  }}
                />
              </label>
            </div>
          </>
        )}
      </CheckboxSection>
      <H2 name="バックアップ">
        {
          // eslint-plugin-react-hooksのバグにより誤った警告が出るため無効化
          // https://github.com/facebook/react/issues/34775

          // eslint-disable-next-line react-hooks/refs
          buttons.map(([text, callback]) => (
            <button key={text} className="button" onClick={callback}>
              {text}
            </button>
          ))
        }
        <input
          type="file"
          accept=".json"
          style={{ display: "none" }}
          ref={input}
          onChange={catchAsync(async (event) => {
            await importBackup(event, save);
          })}
        />
      </H2>
    </div>
  );
}

async function importBackup(
  event: ChangeEvent<HTMLInputElement>,
  saveSettings: (settings: Partial<Settings>) => void,
) {
  const text = await event.target.files?.[0]?.text();
  if (text === undefined) return;

  const backup = JSON.parse(text) as Backup;
  if (backup.settings === undefined) return;

  const newSettings: Record<string, ValueOf<typeof defaultSettings>> = {};
  const keys = Object.keys(defaultSettings);

  // defaultSettingsに存在するキーのみを抽出
  let importedCount = 0;
  for (const key of objectKeys(backup.settings)) {
    if (keys.includes(key)) {
      const value = backup.settings[key];

      if (value !== undefined) {
        newSettings[key] = value;
        importedCount++;
      }
    }
  }

  saveSettings(newSettings);

  const totalCount = Object.keys(backup.settings).length;
  await notify(`${totalCount}件中${importedCount}件の設定をインポートしました`);
}

async function exportBackup() {
  const settings = await getSettings();

  const backup: Backup = {
    settings,
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

async function reset() {
  if (
    !confirm(
      "ストレージに保存されている全てのデータを削除します。\nこの操作により、設定やログがリセットされます。",
    )
  )
    return;

  await sendMessage({ type: "remove-all-data" });
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

const config = {
  groups: [
    {
      heading: "エディター",
      items: [
        {
          id: "enableCloseBrackets",
          label: "括弧を自動で閉じる",
        },
        {
          id: "enableHighlightTrailingWhitespace",
          label: "行末の空白文字をハイライトする",
        },
      ],
    },
    {
      heading: "通知",
      items: [
        {
          id: "notifyOnManualNg",
          label: "手動でNG登録した際に通知する",
        },
        {
          id: "notifyOnAutoNg",
          label: "自動でNG登録した際に通知する",
        },
      ],
    },
    {
      heading: "高度な機能",
      hasChildren: true,
      items: [
        {
          id: "showAdvancedFeatures",
          label: "高度な機能を表示する",
        },
      ],
    },
  ],
  children: [
    {
      id: "importLocalFilterOnLoad",
      label: "ページ読み込み時にローカルフィルターをインポートする",
      childrenProps: [
        {
          id: "importOnlyWhenWslRunning",
          label: "WSL起動時のみインポートする",
        },
      ],
    },
  ],
} satisfies { groups: CheckboxGroups; children: CheckboxProps[] };
