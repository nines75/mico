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
  const [manualFilter, showParsingHints, save] = useSettingsStore(
    useShallow((state) => [
      state.settings.manualFilter,
      state.settings.showParsingHints,
      state.saveSettings,
    ]),
  );

  const { warnings, errors } = parseFilter(manualFilter);

  return (
    <>
      <div className="manual-filter-panel">
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
        <button
          className="button button-filter"
          onClick={() => {
            save({ showParsingHints: !showParsingHints });
          }}
        >
          ヒント{showParsingHints ? "非" : ""}表示
        </button>
        {(() => {
          const config = [
            {
              name: "警告",
              value: warnings.length,
            },
            {
              name: "エラー",
              value: errors.length,
            },
          ].filter(({ value }) => value > 0);

          if (config.length === 0) return null;

          return (
            <div className="info-container">
              {config.map(({ name, value }) => (
                <div className="info" key={name}>
                  {`${name}: `}
                  <span className="info-value">{value}</span>
                </div>
              ))}
            </div>
          );
        })()}
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
