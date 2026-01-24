import { useEffect } from "react";
import { useStorageStore, syncStorageChangeHandler } from "@/utils/store";
import { useShallow } from "zustand/shallow";
import CommentFilter from "./components/tabs/CommentFilter";
import General from "./components/tabs/General";
import Support from "./components/tabs/Support";
import VideoFilter from "./components/tabs/VideoFilter";
import clsx from "clsx";
import type { SettingsTab } from "@/types/storage/settings.types";

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
            state.settings.selectedSettingsTab,
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
                <div className="tab-inner">
                    {config.map((filter) => (
                        <button
                            key={filter.id}
                            className={clsx(
                                "tab-button",
                                selectedTab === filter.id &&
                                    "selected-tab-button",
                            )}
                            onClick={() => {
                                save({ selectedSettingsTab: filter.id });
                            }}
                        >
                            <span>{filter.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            {(() => {
                switch (selectedTab) {
                    case "general":
                        return <General />;
                    case "commentFilter":
                        return <CommentFilter />;
                    case "videoFilter":
                        return <VideoFilter />;
                    case "support":
                        return <Support />;
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
        id: "general",
        name: "一般設定",
    },
    {
        id: "commentFilter",
        name: "コメントフィルター",
    },
    {
        id: "videoFilter",
        name: "動画フィルター",
    },
    {
        id: "support",
        name: "サポート",
    },
] satisfies {
    id: SettingsTab;
    name: string;
}[];
