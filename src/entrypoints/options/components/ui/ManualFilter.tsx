import { useSettingsStore } from "@/utils/store";
import { catchAsync } from "@/utils/util";
import { Download } from "lucide-react";
import { useRef } from "react";
import Editor from "./Editor";
import { useShallow } from "zustand/shallow";
import { parseFilter } from "@/entrypoints/background/parse-filter";

const ICON_SIZE = 18;

export default function ManualFilter() {
  const input = useRef<HTMLInputElement | null>(null);
  const [manualFilter, save] = useSettingsStore(
    useShallow((state) => [state.settings.manualFilter, state.saveSettings]),
  );

  const errorCount = parseFilter(manualFilter).invalidLines.length;

  return (
    <>
      <div>
        <button
          className="button button-filter"
          onClick={() => {
            if (input.current !== null) input.current.click();
          }}
        >
          <Download size={ICON_SIZE} />
          インポート
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
        {errorCount > 0 && (
          <span className="info">
            {"エラー: "}
            <span className="info-value">{errorCount}</span>
          </span>
        )}
      </div>
      <Editor
        value={manualFilter}
        onChange={(value) => {
          save({ manualFilter: value });
        }}
      />
    </>
  );
}
