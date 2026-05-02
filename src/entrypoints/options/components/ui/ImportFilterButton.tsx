import { useStorageStore } from "@/utils/store";
import { catchAsync } from "@/utils/util";
import { Import } from "lucide-react";
import { useRef } from "react";

export default function ImportFilterButton() {
  const input = useRef<HTMLInputElement | null>(null);
  const save = useStorageStore((state) => state.saveSettings);

  return (
    <>
      <button
        className="button button-import-filter"
        onClick={() => {
          if (input.current !== null) input.current.click();
        }}
      >
        <Import size={20} />
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
    </>
  );
}
