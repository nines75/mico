import Editor from "./Editor";
import { useShallow } from "zustand/shallow";
import { useStorageStore } from "@/utils/store";
import clsx from "clsx";
import ImportFilterButton from "./ImportFilterButton";

export type FilterId = "manual" | "auto";

export default function FilterArea() {
    const selectedFilter = useStorageStore(
        (state) => state.settings.selectedFilter,
    );
    const [filter, save] = useStorageStore(
        useShallow((state) => [
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
                <ImportFilterButton />
            </div>
            {selectedFilter === "manual" && (
                <Editor
                    value={filter}
                    onChange={(value) => {
                        save({ manualFilter: value });
                    }}
                />
            )}
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
