import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useStorageStore, storageChangeHandler } from "@/utils/store.js";
import CommentFilterArea from "../options/components/ui/CommentFilterArea.js";
import { quickEditConfig } from "@/utils/config.js";
import { useShallow } from "zustand/shallow";
import VideoFilterArea from "../options/components/ui/VideoFilterArea.js";
import clsx from "clsx";

const dom = document.querySelector("#root");
if (dom !== null) {
    const root = createRoot(dom);
    root.render(<Init />);
}

function Init() {
    const isLoading = useStorageStore((state) => state.isLoading);

    useEffect(() => {
        (async () => {
            await useStorageStore.getState().loadSettingsPageData();
        })();
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
        browser.storage.onChanged.addListener(storageChangeHandler);

        return () => {
            browser.storage.onChanged.removeListener(storageChangeHandler);
        };
    }, []);

    return (
        <>
            <div className="tab-container">
                {quickEditConfig.tab.map((filter) => (
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
