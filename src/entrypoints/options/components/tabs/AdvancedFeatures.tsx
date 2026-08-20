import { catchAsync } from "@/utils/util";
import type { SectionsItem } from "../ui/Sections";
import Sections from "../ui/Sections";
import { importLocalFilter } from "@/utils/storage-write";
import { saveBackup } from "@/utils/browser";

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
      {
        type: "button",
        id: "importLocalFilterButton",
        label: "ローカルフィルターをインポート",
        onClick: catchAsync(async () => {
          await importLocalFilter("button");
        }),
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
        type: "checkbox",
        id: "saveBackupWithoutManualFilter",
        label: "Manualフィルターなしで保存する",
      },
      {
        type: "input",
        id: "backupPath",
        label: "バックアップを保存するディレクトリのパス",
      },
      {
        type: "button",
        id: "saveBackupButton",
        label: "バックアップを保存",
        onClick: catchAsync(async () => {
          await saveBackup("button");
        }),
      },
    ],
  },
] satisfies SectionsItem;
