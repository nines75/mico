import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import Backup from "./components/sections/Backup.js";
import CommentFilter from "./components/sections/CommentFilter.js";
import ExpandNicoru from "./components/sections/ExpandNicoru.js";
import { useStorageStore, storageChangeHandler } from "@/utils/store.js";
import { settingsConfig, urls } from "@/utils/config.js";
import { SiGithub } from "@icons-pack/react-simple-icons";
import VideoFilter from "./components/sections/VideoFilter.js";
import General from "./components/sections/General.js";
import { useShallow } from "zustand/shallow";

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
            state.settings.selectedSettingsTab,
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
            <div className="header-container">
                <h1>設定</h1>
                <a
                    className="link"
                    href={urls.repository}
                    target="_blank"
                    rel="noreferrer"
                >
                    <SiGithub size={38} color="var(--dim-white)" />
                </a>
            </div>
            <div className="tab-container">
                {settingsConfig.tab.map((filter) => (
                    <button
                        key={filter.id}
                        className={`tab-button${selectedTab === filter.id ? " selected-tab-button" : ""}`}
                        onClick={() => save({ selectedSettingsTab: filter.id })}
                    >
                        <span>{filter.name}</span>
                    </button>
                ))}
            </div>
            {(() => {
                switch (selectedTab) {
                    case "general":
                        return <General />;
                    case "commentFilter":
                        return <CommentFilter />;
                    case "videoFilter":
                        return <VideoFilter />;
                    case "expandNicoru":
                        return <ExpandNicoru />;
                    case "backup":
                        return <Backup />;
                }
            })()}
        </>
    );
}
