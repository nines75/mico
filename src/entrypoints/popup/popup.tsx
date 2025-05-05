import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import Count from "./components/Count.js";
import LogViewer from "./components/LogViewer.js";
import ProcessingTime from "./components/ProcessingTime.js";
import Details from "./components/Details.js";
import { popupConfig, texts, urls } from "@/utils/config.js";
import { useStorageStore, storageChangeHandler } from "@/utils/store.js";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { SettingsIcon } from "lucide-react";

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
                await useStorageStore.getState().loadPopupPageData();
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    if (isLoading) return null;

    return <Page />;
}

function Page() {
    const videoId = useStorageStore.getState().videoId;

    const name = browser.runtime.getManifest().name;
    const version = `v${browser.runtime.getManifest().version}`;
    const message = getMessage(videoId);

    useEffect(() => {
        browser.storage.onChanged.addListener(storageChangeHandler);

        return () => {
            browser.storage.onChanged.removeListener(storageChangeHandler);
        };
    }, []);

    return (
        <div className="container">
            <header>
                <span id="version">{`${name} ${version}`}</span>
                <div className="link-container">
                    <a className="link" href={urls.repository}>
                        <SiGithub size={24} color="var(--dim-white)" />
                    </a>
                    <a className="link" href="/options.html" target="_blank">
                        <SettingsIcon size={24} color="var(--dim-white)" />
                    </a>
                </div>
            </header>
            {message !== undefined ? (
                <div id="message">{message}</div>
            ) : (
                <main>
                    <section>
                        <span id="video-id">{videoId ?? ""}</span>
                    </section>
                    <Details id={"isOpenProcessingTime"} summary="処理時間">
                        <ProcessingTime />
                    </Details>
                    <Details id={"isOpenCount"} summary="カウント情報">
                        <Count />
                    </Details>
                    <Details id={"isOpenVideoLog"} summary="フィルタリングログ">
                        {popupConfig.log.map((log) => (
                            <LogViewer key={log.id} {...log} />
                        ))}
                    </Details>
                </main>
            )}
        </div>
    );
}

const getMessage = (videoId: string | undefined): string | undefined => {
    const settings = useStorageStore.getState().settings;

    if (videoId === undefined) return texts.popup.messageNotWork;

    if (!settings.isCommentFilterEnabled) {
        return texts.popup.messageCommentFilterDisabled;
    }
    if (!settings.isSaveFilteringLog) {
        return texts.popup.messageFilteringLogDisabled;
    }

    return undefined;
};
