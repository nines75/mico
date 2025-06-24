import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import Backup from "./components/sections/Backup.js";
import CommentFilter from "./components/sections/CommentFilter.js";
import ExpandNicoru from "./components/sections/ExpandNicoru.js";
import { useStorageStore, storageChangeHandler } from "@/utils/store.js";
import { urls } from "@/utils/config.js";
import { SiGithub } from "@icons-pack/react-simple-icons";
import VideoFilter from "./components/sections/VideoFilter.js";
import General from "./components/sections/General.js";

const dom = document.querySelector("#root");
if (dom !== null) {
    const root = createRoot(dom);
    root.render(<Init />);
}

function Init() {
    const isLoading = useStorageStore((state) => state.isLoading);

    useEffect(() => {
        (async () => {
            try {
                await useStorageStore.getState().loadSettingsPageData();
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    if (isLoading) return null;

    return <Page />;
}

function Page() {
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
            <General />
            <CommentFilter />
            <VideoFilter />
            <ExpandNicoru />
            <Backup />
        </>
    );
}
