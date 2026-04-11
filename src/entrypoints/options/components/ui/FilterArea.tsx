import Editor from "./Editor";
import { useShallow } from "zustand/shallow";
import { useStorageStore } from "@/utils/store";
import clsx from "clsx";
import ImportFilterButton from "./ImportFilterButton";
import AutoFilter from "./AutoFilter";

export type FilterId = "manual" | "auto";

export default function FilterArea() {
    const [selectedFilter, manualFilter, save] = useStorageStore(
        useShallow((state) => [
            state.settings.selectedFilter,
            state.settings.manualFilter,
            state.saveSettings,
        ]),
    );

    return (
        <>
            <div className="button-container">
                {config.map(({ id, name }) => (
                    <button
                        key={id}
                        className={clsx(
                            "button",
                            "filter-button",
                            id === selectedFilter && "selected-button",
                        )}
                        onClick={() => {
                            save({ selectedFilter: id });
                        }}
                    >
                        {name}
                    </button>
                ))}
                {selectedFilter === "manual" && <ImportFilterButton />}
            </div>
            {selectedFilter === "manual" && (
                <Editor
                    value={manualFilter}
                    onChange={(value) => {
                        save({ manualFilter: value });
                    }}
                />
            )}
            {selectedFilter === "auto" && <AutoFilter />}
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
