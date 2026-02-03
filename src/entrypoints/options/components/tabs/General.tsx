import { defaultSettings, messages } from "@/utils/config";
import H2 from "../ui/H2";
import { useStorageStore } from "@/utils/store";
import type { BackupData } from "@/types/storage/backup.types";
import type { Settings } from "@/types/storage/settings.types";
import { getSettingsData } from "@/utils/storage";
import type { ValueOf } from "type-fest";
import type { ChangeEvent } from "react";
import { useRef } from "react";
import { useShallow } from "zustand/shallow";
import type { CheckboxGroups } from "../ui/CheckboxSection";
import CheckboxSection from "../ui/CheckboxSection";
import { catchAsync } from "@/utils/util";
import { sendMessageToBackground } from "@/utils/browser";
import { objectKeys } from "ts-extras";

export default function General() {
    const input = useRef<HTMLInputElement | null>(null);
    const [isAdvancedFeaturesVisible, localFilterPath, save] = useStorageStore(
        useShallow((state) => [
            state.settings.isAdvancedFeaturesVisible,
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
        <div className="settings-container">
            <CheckboxSection groups={config}>
                {isAdvancedFeaturesVisible && (
                    <div className="setting">
                        <label>
                            {"インポートするローカルフォルダのパス"}
                            <input
                                className="input"
                                value={localFilterPath}
                                onChange={(e) => {
                                    save({
                                        localFilterPath: e.target.value,
                                    });
                                }}
                            />
                        </label>
                    </div>
                )}
            </CheckboxSection>
            <H2 name="バックアップ">
                {
                    // eslint-plugin-react-hooksのバグにより誤った警告が出るため無効化
                    // https://github.com/facebook/react/issues/34775

                    // eslint-disable-next-line react-hooks/refs
                    buttons.map(([text, callback]) => (
                        <button
                            key={text}
                            className="common-button"
                            onClick={callback}
                        >
                            {text}
                        </button>
                    ))
                }
                <input
                    type="file"
                    accept=".json"
                    style={{ display: "none" }}
                    ref={input}
                    onChange={(e) => {
                        importBackup(e, save);
                    }}
                />
            </H2>
        </div>
    );
}

function importBackup(
    event: ChangeEvent<HTMLInputElement>,
    saveSettings: (settings: Partial<Settings>) => void,
) {
    const reader = new FileReader();
    reader.addEventListener("load", (e) => {
        const res = e.target?.result;

        if (typeof res === "string") {
            const backup = JSON.parse(res) as BackupData;

            if (backup.settings !== undefined) {
                type valuesType = ValueOf<typeof defaultSettings>;

                const newSettings: Record<string, valuesType> = {};
                const keys = Object.keys(defaultSettings);

                // defaultSettingsに存在するキーのみを抽出
                for (const key of objectKeys(backup.settings)) {
                    if (keys.includes(key)) {
                        const value = backup.settings[key];

                        if (value !== undefined) newSettings[key] = value;
                    }
                }

                saveSettings(newSettings);
            }
        }
    });

    const file = event.target.files?.[0];
    if (file === undefined) return;

    reader.readAsText(file);
}

async function exportBackup() {
    const settingsData = await getSettingsData();
    if (settingsData === null) {
        // 一度も設定が保存されていない場合
        alert(messages.settings.neverReset);
        return;
    }

    const data: BackupData = {
        settings: settingsData,
    };
    const dataStr = JSON.stringify(data);

    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const fileName = `${browser.runtime.getManifest().name}-backup.json`;

    // downloads権限なしでダウンロード
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
}

async function reset() {
    if (!confirm(messages.settings.confirmReset)) return;

    await sendMessageToBackground({
        type: "remove-all-data",
    });
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

const config = [
    {
        heading: "エディター",
        items: [
            {
                id: "isCloseBrackets",
                label: "括弧を自動で閉じる",
            },
            {
                id: "isHighlightTrailingWhitespace",
                label: "行末の空白文字をハイライトする",
            },
        ],
    },
    {
        heading: "高度な機能",
        isChildren: true,
        items: [
            {
                id: "isAdvancedFeaturesVisible",
                label: "高度な機能を表示する",
            },
        ],
    },
] satisfies CheckboxGroups;
