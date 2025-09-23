import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import Count from "./components/Count.js";
import CommentLogViewer from "./components/CommentLogViewer.js";
import ProcessingTime from "./components/ProcessingTime.js";
import { popupConfig, messages, urls, titles } from "@/utils/config.js";
import { useStorageStore, storageChangeHandler } from "@/utils/store.js";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { ScreenShareOff, SettingsIcon, UserX } from "lucide-react";
import { useShallow } from "zustand/shallow";
import VideoLogViewer from "./components/VideoLogViewer.js";
import Details from "./components/Details.js";
import { PopupTab } from "@/types/storage/settings.types.js";
import { formatNgId } from "../background/video-filter/filter/id-filter.js";

const dom = document.querySelector("#root");
if (dom !== null) {
    const root = createRoot(dom);
    root.render(<Init />);
}

function Init() {
    const isLoading = useStorageStore((state) => state.isLoading);

    useEffect(() => {
        (async () => {
            await useStorageStore.getState().loadPopupPageData();
        })();
    }, []);

    if (isLoading) return null;

    return <Page />;
}

function Page() {
    const name = browser.runtime.getManifest().name;
    const version = `v${browser.runtime.getManifest().version}`;

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
            <Main />
        </div>
    );
}

function Main() {
    const settings = useStorageStore.getState().settings;
    const [videoId, rawSelectedTab, save] = useStorageStore(
        useShallow((state) => [
            state.log?.videoId,
            state.settings.popupSelectedTab,
            state.saveSettings,
        ]),
    );

    const getDisabledMessage = (text: string) => (
        <section>
            <span id="disabled-message">
                {text}
                <br />
                {messages.popup.outdatedLog}
            </span>
        </section>
    );

    const isWatchPage = useStorageStore.getState().isWatchPage;
    const isDeleted = videoId === undefined || videoId === null;
    const hasVideo = isWatchPage && !isDeleted;

    const isRankingPage = useStorageStore.getState().isRankingPage;
    const isSearchPage = useStorageStore.getState().isSearchPage;

    if (!hasVideo && !isRankingPage && !isSearchPage) {
        return <div id="message">{messages.popup.notWorking}</div>;
    }

    // 視聴ページ以外は動画フィルターのみ表示
    const selectedTab: PopupTab = isWatchPage ? rawSelectedTab : "videoFilter";

    return (
        <main>
            {videoId !== undefined && videoId !== null && (
                <section>
                    <span id="video-id">{videoId}</span>
                    <div className="ng-button-container">
                        <button
                            className="ng-button"
                            title={titles.addNgVideo}
                            onClick={() => onClickNgVideoButton()}
                        >
                            <ScreenShareOff size={28} />
                        </button>
                        <button
                            className="ng-button"
                            title={titles.addNgUserIdByVideo}
                            onClick={() => onClickNgUserButton()}
                        >
                            <UserX size={28} />
                        </button>
                    </div>
                </section>
            )}
            {hasVideo && (
                <div>
                    {popupConfig.tab.map((filter) => (
                        <button
                            key={filter.id}
                            className={`common-button${selectedTab === filter.id ? " selected-button" : ""}`}
                            onClick={() =>
                                save({ popupSelectedTab: filter.id })
                            }
                        >
                            <span>{filter.name}</span>
                        </button>
                    ))}
                </div>
            )}
            {(() => {
                switch (selectedTab) {
                    case "commentFilter":
                        if (settings.isCommentFilterEnabled) return null;

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
                <ProcessingTime {...{ selectedTab }} />
            </Details>
            <Details id={"isOpenCount"} summary="カウント情報">
                <Count {...{ selectedTab }} />
            </Details>
            <Details id={"isOpenVideoLog"} summary="フィルタリングログ">
                {(() => {
                    switch (selectedTab) {
                        case "commentFilter":
                            return popupConfig.commentFilter.log.map((log) => (
                                <CommentLogViewer key={log.id} {...log} />
                            ));
                        case "videoFilter":
                            return popupConfig.videoFilter.log.map((log) => (
                                <VideoLogViewer key={log.id} {...log} />
                            ));
                    }
                })()}
            </Details>
        </main>
    );
}

async function onClickNgVideoButton() {
    if (!confirm(messages.ngVideoId.confirmAddition)) return;

    const settings = useStorageStore.getState().settings;
    const videoId = useStorageStore.getState().log?.videoId ?? undefined;
    const title = useStorageStore.getState().log?.title ?? undefined;

    if (videoId === undefined || title === undefined) {
        alert(messages.ngVideoId.additionFailed);
        return;
    }

    await browser.runtime.sendMessage({
        type: "add-ng-id",
        data: formatNgId(videoId, title, settings),
    });
}

async function onClickNgUserButton() {
    if (!confirm(messages.ngUserId.confirmAdditionByVideo)) return;

    const settings = useStorageStore.getState().settings;
    const userId = useStorageStore.getState().log?.userId ?? undefined;
    const userName = useStorageStore.getState().log?.userName ?? undefined;

    // メインリクエストからユーザ名を抽出する場合はユーザーが削除済みでも存在するためどちらも弾く
    if (userId === undefined || userName === undefined) {
        alert(messages.ngUserId.additionFailed);
        return;
    }

    await browser.runtime.sendMessage({
        type: "add-ng-id",
        data: formatNgId(userId, userName, settings),
    });
}
