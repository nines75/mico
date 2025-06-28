import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import Count from "./components/Count.js";
import CommentLogViewer from "./components/CommentLogViewer.js";
import ProcessingTime from "./components/ProcessingTime.js";
import { popupConfig, messages, urls } from "@/utils/config.js";
import { useStorageStore, storageChangeHandler } from "@/utils/store.js";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { SettingsIcon } from "lucide-react";
import { useShallow } from "zustand/shallow";
import VideoLogViewer from "./components/VideoLogViewer.js";
import { Settings } from "@/types/storage/settings.types.js";
import Details from "./components/Details.js";

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
    const settings = useStorageStore.getState().settings;
    const isNiconico = useStorageStore.getState().isNiconico;
    const [videoId, selectedTab, save] = useStorageStore(
        useShallow((state) => [
            state.log?.videoId,
            state.settings.popupSelectedTab,
            state.saveSettings,
        ]),
    );

    const name = browser.runtime.getManifest().name;
    const version = `v${browser.runtime.getManifest().version}`;
    const message = getMessage(isNiconico, settings);

    const getDisabledMessage = (text: string) => (
        <section>
            <span id="disabled-message">
                {text}
                <br />
                {messages.popup.outdatedLog}
            </span>
        </section>
    );

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
                    <div>
                        {popupConfig.tab.map((filter) => (
                            <button
                                key={filter.id}
                                className={`${selectedTab === filter.id ? "selected-button" : ""}`}
                                onClick={() =>
                                    save({ popupSelectedTab: filter.id })
                                }
                            >
                                <span>{filter.name}</span>
                            </button>
                        ))}
                    </div>
                    {(() => {
                        switch (selectedTab) {
                            case "commentFilter":
                                if (settings.isCommentFilterEnabled)
                                    return null;

                                return getDisabledMessage(
                                    messages.popup.commentFilterDisabled,
                                );
                            case "videoFilter":
                                if (settings.isVideoFilterEnabled) return null;

                                return getDisabledMessage(
                                    messages.popup.videoFilterDisabled,
                                );
                        }
                    })()}
                    <Details id={"isOpenProcessingTime"} summary="処理時間">
                        <ProcessingTime />
                    </Details>
                    <Details id={"isOpenCount"} summary="カウント情報">
                        <Count />
                    </Details>
                    <Details id={"isOpenVideoLog"} summary="フィルタリングログ">
                        {(() => {
                            switch (selectedTab) {
                                case "commentFilter":
                                    return popupConfig.commentFilter.log.map(
                                        (log) => (
                                            <CommentLogViewer
                                                key={log.id}
                                                {...log}
                                            />
                                        ),
                                    );
                                case "videoFilter":
                                    return popupConfig.videoFilter.log.map(
                                        (log) => (
                                            <VideoLogViewer
                                                key={log.id}
                                                {...log}
                                            />
                                        ),
                                    );
                            }
                        })()}
                    </Details>
                </main>
            )}
        </div>
    );
}

const getMessage = (
    isNiconico: boolean,
    settings: Settings,
): string | undefined => {
    if (!isNiconico) return messages.popup.notWorking;

    if (!settings.isSaveFilteringLog) {
        return messages.popup.filteringLogDisabled;
    }

    return undefined;
};
