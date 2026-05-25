import { useShallow } from "zustand/shallow";
import { useSettingsStore } from "@/utils/store";
import clsx from "clsx";
import ManualFilterButton from "../ui/ManualFilterButton";
import Editor from "../ui/Editor";
import AutoFilter from "../ui/AutoFilter";

export type FilterId = "manual" | "auto";

export default function Filter() {
  const [selectedFilter, manualFilter, save] = useSettingsStore(
    useShallow((state) => [
      state.settings.selectedFilter,
      state.settings.manualFilter,
      state.saveSettings,
    ]),
  );

  return (
    <>
      <div className="button-container">
        <div>
          {config.map(({ id, name }) => (
            <button
              key={id}
              className={clsx(
                "button",
                "button-filter",
                id === selectedFilter && "selected",
              )}
              onClick={() => {
                save({ selectedFilter: id });
              }}
            >
              {name}
            </button>
          ))}
        </div>
        {selectedFilter === "manual" && <ManualFilterButton />}
      </div>
      {(() => {
        switch (selectedFilter) {
          case "manual": {
            return (
              <Editor
                value={manualFilter}
                onChange={(value) => {
                  save({ manualFilter: value });
                }}
              />
            );
          }
          case "auto": {
            return <AutoFilter />;
          }
        }
      })()}
    </>
  );
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

const config = [
  {
    id: "manual",
    name: "Manual",
  },
  {
    id: "auto",
    name: "Auto",
  },
] satisfies {
  id: FilterId;
  name: string;
}[];
