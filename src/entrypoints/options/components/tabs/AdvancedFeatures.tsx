import type { SectionsItem } from "../ui/CheckboxSection";
import Sections from "../ui/CheckboxSection";

export default function AdvancedFeatures() {
  return (
    <div className="tab-content">
      <Sections sections={config} />
    </div>
  );
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

const config = [
  {
    heading: "ローカルフィルター",
    items: [
      {
        type: "checkbox",
        id: "importLocalFilterOnLoad",
        label: "ページ読み込み時にローカルフィルターをインポートする",
        childrenProps: [
          {
            type: "checkbox",
            id: "importOnlyWhenWslRunning",
            label: "WSL起動時のみインポートする",
          },
        ],
      },
      {
        type: "input",
        id: "localFilterPath",
        label: "インポートするローカルフィルターのパス",
      },
    ],
  },
  {
    heading: "自動バックアップ",
    items: [
      {
        type: "checkbox",
        id: "saveBackupOnStartup",
        label: "起動時にバックアップを保存する",
        childrenProps: [
          {
            type: "checkbox",
            id: "saveBackupWithoutManualFilter",
            label: "Manualフィルターなしで保存する",
          },
          {
            type: "checkbox",
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
      {
        type: "input",
        id: "backupPath",
        label: "バックアップを保存するディレクトリのパス",
      },
    ],
  },
] satisfies SectionsItem;
