import { useShallow } from "zustand/shallow";
import { useSettingsStore } from "@/utils/store";
import clsx from "clsx";
import ManualFilter from "../ui/ManualFilter";
import AutoFilter from "../ui/AutoFilter";

export type FilterId = "manual" | "auto";

export default function Filter() {
  const [selectedFilter, save] = useSettingsStore(
    useShallow((state) => [state.settings.selectedFilter, state.saveSettings]),
  );

  return (
    <>
      <div>
        <button
          className={clsx("button", "button-filter")}
          onClick={() => {
            save({
              selectedFilter: selectedFilter === "manual" ? "auto" : "manual",
            });
          }}
        >
          フィルター切り替え
        </button>
        <span className="info">
          現在のフィルター:
          <span className="info-value">
            {selectedFilter === "manual" ? "Manual" : "Auto"}
          </span>
        </span>
      </div>
      {(() => {
        switch (selectedFilter) {
          case "manual": {
            return <ManualFilter />;
          }
          case "auto": {
            return <AutoFilter />;
          }
        }
      })()}
    </>
  );
}
