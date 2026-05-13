import type { InvalidLine } from "@/entrypoints/background/parse-filter";
import { parseFilter } from "@/entrypoints/background/parse-filter";
import { notify } from "@/utils/browser";
import { useSettingsStore } from "@/utils/store";
import { catchAsync } from "@/utils/util";
import { Import, TriangleAlert } from "lucide-react";
import { useRef } from "react";

const ICON_SIZE = 20;

export default function ManualFilterButton() {
  const input = useRef<HTMLInputElement | null>(null);
  const save = useSettingsStore((state) => state.saveSettings);

  return (
    <div className="button-group">
      <button
        className="button button-manual-filter"
        onClick={() => {
          if (input.current !== null) input.current.click();
        }}
      >
        <Import size={ICON_SIZE} />
        インポート
      </button>
      <button
        className="button button-manual-filter"
        onClick={catchAsync(async () => {
          const { invalidLines } = parseFilter(
            useSettingsStore.getState().settings,
          );
          if (invalidLines.length === 0) {
            await notify("エラーはありません");
            return;
          }

          alert(
            invalidLines
              .map(
                ({ index, line, type }) =>
                  `${index + 1}行目: ${line}\nエラー: ${getErrorMessage(type)}`,
              )
              .join("\n\n"),
          );
        })}
      >
        <TriangleAlert size={ICON_SIZE} />
        エラーを表示
      </button>
      <input
        type="file"
        accept=".txt, .mico"
        style={{ display: "none" }}
        ref={input}
        onChange={catchAsync(async (event) => {
          const text = await event.target.files?.[0]?.text();
          if (text === undefined) return;

          save({ manualFilter: text });
        })}
      />
    </div>
  );
}

function getErrorMessage(type: InvalidLine["type"]) {
  switch (type) {
    case "directive": {
      return "無効なディレクティブ";
    }
    case "regex": {
      return "無効な正規表現";
    }
    case "regex-flag": {
      return "無効な正規表現フラグ";
    }
  }
}
