// TODO: 原因を調べる(eslint-plugin-react-hooks自体の不具合？)
/* eslint-disable react-hooks/refs */
import { defaultSettings, messages } from "@/utils/config.js";
import type { CheckboxProps } from "../ui/Checkbox.js";
import Checkbox from "../ui/Checkbox.js";
import H2 from "../ui/H2.js";
import { useStorageStore } from "@/utils/store.js";
import type { BackupData } from "@/types/storage/backup.types.js";
import type { Settings } from "@/types/storage/settings.types.js";
import { getSettingsData } from "@/utils/storage.js";
import type { ValueOf } from "type-fest";
import { useRef } from "react";
import { useShallow } from "zustand/shallow";
import type { CheckboxGroups } from "../ui/CheckboxSection.js";
import CheckboxSection from "../ui/CheckboxSection.js";
import { catchAsync } from "@/utils/util.js";
import { sendMessageToBackground } from "@/utils/browser.js";

export default function General() {
    const input = useRef<HTMLInputElement | null>(null);
    const [isAdvancedFeaturesVisible, saveSettings] = useStorageStore(
        useShallow((state) => [
            state.settings.isAdvancedFeaturesVisible,
            state.saveSettings,
        ]),
    );

    const clickInput = () => {
        if (input.current !== null) input.current.click();
    };

    return (
        <div className="settings-container">
            <CheckboxSection groups={config.checkbox}>
                {isAdvancedFeaturesVisible &&
                    config.advanced.map((props) => (
                        <Checkbox key={props.id} {...props} />
                    ))}
            </CheckboxSection>
            <H2 name="バックアップ">
                {(
                    [
                        ["インポート", clickInput],
                        ["エクスポート", catchAsync(exportBackup)],
                        ["リセット", catchAsync(reset)],
                    ] as const
                ).map(([text, callback]) => (
                    <button
                        key={text}
                        className="common-button"
                        onClick={callback}
                    >
                        {text}
                    </button>
                ))}
                <input
                    type="file"
                    accept=".json"
                    style={{ display: "none" }}
                    ref={input}
                    onChange={(e) => {
                        importBackup(e, saveSettings);
                    }}
                />
            </H2>
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

const config = {
    checkbox: [
        {
            header: "エディター",
            items: [
                {
                    id: "isCloseBrackets",
                    label: "括弧を自動で閉じる",
                },
                {
                    id: "isHighlightTrailingWhitespace",
                    label: "行末の空白文字をハイライトする",
                },
                {
                    id: "isVimModeEnabled",
                    label: "Vimモードを有効にする",
                },
            ],
        },
        {
            header: "クイック編集",
            items: [
                {
                    id: "isConfirmCloseQuickEdit",
                    label: "閉じる前に確認ダイアログを表示する",
                },
            ],
        },
        {
            header: "高度な機能",
            isChildren: true,
            items: [
                {
                    id: "isAdvancedFeaturesVisible",
                    label: "高度な機能を表示する",
                },
            ],
        },
    ],
    advanced: [
        {
            id: "isImeDisabledByContext",
            label: "コンテキストに応じてIMEを無効化する",
            details: `Vimモードでのみ有効となり、ノーマルモードに戻った際やエディターにフォーカスした際にIMEが無効化されます。
            ネイティブメッセージング権限とバイナリのインストールが必要です。`,
        },
    ],
} as const satisfies {
    checkbox: CheckboxGroups;
    advanced: CheckboxProps[];
};
