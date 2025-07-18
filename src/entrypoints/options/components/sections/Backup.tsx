import { BackupData } from "@/types/storage/backup.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { defaultSettings, messages } from "@/utils/config.js";
import { removeAllData, getSettingsData } from "@/utils/storage.js";
import { useStorageStore } from "@/utils/store.js";
import { useRef } from "react";
import { ValueOf } from "type-fest";

export default function Backup() {
    const input = useRef<HTMLInputElement | null>(null);
    const saveSettings = useStorageStore((state) => state.saveSettings);

    return (
        <div className="settings-container">
            <button
                className="backup-button"
                onClick={() => {
                    if (input.current !== null) input.current.click();
                }}
            >
                インポート
            </button>
            <button className="backup-button" onClick={() => exportBackup()}>
                エクスポート
            </button>
            <button className="backup-button" onClick={() => reset()}>
                リセット
            </button>
            <input
                type="file"
                accept=".json"
                style={{ display: "none" }}
                ref={input}
                onChange={(e) => importBackup(e, saveSettings)}
            />
        </div>
    );
}

function importBackup(
    event: React.ChangeEvent<HTMLInputElement>,
    saveSettings: (settings: Partial<Settings>) => void,
) {
    const reader = new FileReader();
    reader.onload = (f) => {
        const res = f.target?.result;

        if (typeof res === "string") {
            const backup = JSON.parse(res) as BackupData;

            if (backup.settings !== undefined) {
                type valuesType = ValueOf<typeof defaultSettings>;

                const newSettings: Record<string, valuesType> = {};
                const keys = new Set(Object.keys(defaultSettings));

                // defaultSettingsに存在するキーのみを抽出
                Object.keys(backup.settings).forEach((key) => {
                    if (keys.has(key)) {
                        const value = backup.settings?.[key as keyof Settings];

                        if (value !== undefined) newSettings[key] = value;
                    }
                });

                saveSettings(newSettings);
            }
        }
    };

    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file === undefined) return;

    reader.readAsText(file);
}

async function exportBackup() {
    try {
        const settingsData = await getSettingsData();
        if (settingsData === undefined) {
            // 一度も設定が保存されていない場合
            alert(messages.settings.neverReset);
            return;
        }

        // valueがundefinedの場合でもkey自体が作成されないので問題ない
        const data: BackupData = {
            settings: settingsData,
        };
        const dataStr = JSON.stringify(data);

        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const filename = `${browser.runtime.getManifest().name}-backup.json`;

        // downloads権限なしでダウンロード
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
    } catch (e) {
        console.error(e);
    }
}

async function reset() {
    try {
        if (!confirm(messages.settings.confirmReset)) return;

        await removeAllData();
    } catch (e) {
        console.error(e);
    }
}
