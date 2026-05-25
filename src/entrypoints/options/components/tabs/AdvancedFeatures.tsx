import type { CheckboxProps } from "../ui/Checkbox";
import Input from "../ui/Input";
import Checkboxes from "../ui/Checkbox";

export default function AdvancedFeatures() {
  return (
    <div className="tab-content">
      <Checkboxes items={config.importLocalFilter} />
      <Input
        id="localFilterPath"
        label="インポートするローカルフィルターのパス"
      />
      <Checkboxes items={config.saveBackup} />
      <Input id="backupPath" label="バックアップを保存するディレクトリのパス" />
    </div>
  );
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

const config = {
  importLocalFilter: [
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
  saveBackup: [
    {
      id: "saveBackupOnStartup",
      label: "起動時にバックアップを保存する",
      childrenProps: [
        {
          id: "saveBackupWithoutManualFilter",
          label: "Manualフィルターなしで保存する",
        },
        {
          id: "saveBackupOnlyAfterInterval",
          label: "前回の保存から一定時間経過したときのみ保存する",
          input: {
            id: "backupIntervalThreshold",
            label: "時間",
            min: 1,
          },
        },
      ],
    },
  ],
} satisfies {
  importLocalFilter: CheckboxProps[];
  saveBackup: CheckboxProps[];
};
