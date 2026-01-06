import { useEffect } from "react";
import { useStorageStore, syncStorageChangeHandler } from "@/utils/store";
import CommentFilterArea from "../options/components/ui/CommentFilterArea";
import { useShallow } from "zustand/shallow";
import VideoFilterArea from "../options/components/ui/VideoFilterArea";
import clsx from "clsx";
import type { FilterTab } from "@/types/storage/settings.types";

export function Init() {
    const isLoading = useStorageStore((state) => state.isLoading);

    useEffect(() => {
        useStorageStore.getState().loadSettingsPageData();
    }, []);

    if (isLoading) return null;

    return <Page />;
}

function Page() {
    const [selectedTab, save] = useStorageStore(
        useShallow((state) => [
            state.settings.selectedQuickEditTab,
            state.saveSettings,
        ]),
    );

    useEffect(() => {
        browser.storage.onChanged.addListener(syncStorageChangeHandler);

        return () => {
            browser.storage.onChanged.removeListener(syncStorageChangeHandler);
        };
    }, []);

    return (
        <>
            <div className="tab-container">
                {config.map((filter) => (
                    <button
                        key={filter.id}
                        className={clsx(
                            "tab-button",
                            selectedTab === filter.id && "selected-tab-button",
                        )}
                        onClick={() => {
                            save({ selectedQuickEditTab: filter.id });
                        }}
                    >
                        <span>{filter.name}</span>
                    </button>
                ))}
            </div>
            {(() => {
                switch (selectedTab) {
                    case "commentFilter":
                        return <CommentFilterArea />;
                    case "videoFilter":
                        return <VideoFilterArea />;
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
        id: "commentFilter",
        name: "コメントフィルター",
    },
    {
        id: "videoFilter",
        name: "動画フィルター",
    },
] satisfies {
    id: FilterTab;
    name: string;
}[];
