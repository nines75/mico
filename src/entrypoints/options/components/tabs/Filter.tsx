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
