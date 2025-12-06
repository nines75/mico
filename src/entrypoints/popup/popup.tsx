import { useEffect } from "react";
import Count from "./components/Count.js";
import CommentLogViewer from "./components/CommentLogViewer.js";
import ProcessingTime from "./components/ProcessingTime.js";
import { popupConfig, messages, urls, titles } from "@/utils/config.js";
import { useStorageStore, syncStorageChangeHandler } from "@/utils/store.js";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { ScreenShareOff, SettingsIcon, UserX } from "lucide-react";
import { useShallow } from "zustand/shallow";
import VideoLogViewer from "./components/VideoLogViewer.js";
import Details from "./components/Details.js";
import { FilterTab } from "@/types/storage/settings.types.js";
import { formatNgId } from "../background/video-filter/filter/id-filter.js";
import { sendMessageToBackground } from "../background/message.js";
import clsx from "clsx";
import { catchAsync, replace } from "@/utils/util.js";

export function Init() {
    const isLoading = useStorageStore((state) => state.isLoading);

    useEffect(() => {
        useStorageStore.getState().loadPopupPageData();
    }, []);

    if (isLoading) return null;

    return <Page />;
}

function Page() {
    const name = browser.runtime.getManifest().name;
    const version = `v${browser.runtime.getManifest().version}`;

    useEffect(() => {
        browser.storage.onChanged.addListener(syncStorageChangeHandler);

        return () => {
            browser.storage.onChanged.removeListener(syncStorageChangeHandler);
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
    const [videoId, rawSelectedTab, save] = useStorageStore(
        useShallow((state) => [
            state.log?.tab?.videoId,
            state.settings.selectedPopupTab,
            state.saveSettings,
        ]),
    );

    const isWatchPage = useStorageStore.getState().isWatchPage;
    const isRankingPage = useStorageStore.getState().isRankingPage;
    const isSearchPage = useStorageStore.getState().isSearchPage;

    if (!isWatchPage && !isRankingPage && !isSearchPage) {
        return <div id="message">{messages.popup.notWorking}</div>;
    }

    // 視聴ページ以外は動画フィルターのみ表示
    const selectedTab: FilterTab = isWatchPage ? rawSelectedTab : "videoFilter";

    return (
        <main>
            {videoId !== undefined && (
                <section>
                    <span id="video-id">{videoId}</span>
                    <div className="ng-button-container">
                        <button
                            className="ng-button"
                            title={titles.addNgVideo}
                            onClick={catchAsync(onClickNgVideoButton)}
                        >
                            <ScreenShareOff size={28} />
                        </button>
                        <button
                            className="ng-button"
                            title={titles.addNgUserIdByVideo}
                            onClick={catchAsync(onClickNgUserButton)}
                        >
                            <UserX size={28} />
                        </button>
                    </div>
                </section>
            )}
            {isWatchPage && (
                <div>
                    {popupConfig.tab.map((filter) => (
                        <button
                            key={filter.id}
                            className={clsx(
                                "common-button",
                                selectedTab === filter.id && "selected-button",
                            )}
                            onClick={() => {
                                save({ selectedPopupTab: filter.id });
                            }}
                        >
                            <span>{filter.name}</span>
                        </button>
                    ))}
                </div>
            )}
            <Details id={"isProcessingTimeOpen"} summary="処理時間">
                <ProcessingTime {...{ selectedTab }} />
            </Details>
            <Details id={"isCountOpen"} summary="カウント情報">
                <Count {...{ selectedTab }} />
            </Details>
            <Details id={"isLogOpen"} summary="フィルタリングログ">
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
    const settings = useStorageStore.getState().settings;
    const videoId = useStorageStore.getState().log?.tab?.videoId;
    const title = useStorageStore.getState().log?.tab?.title;

    if (videoId === undefined || title === undefined) {
        alert(messages.ngVideoId.getInfoFailed);
        return;
    }
    if (
        !confirm(
            replace(messages.ngVideoId.confirmAddition, [
                `${videoId} (${title})`,
            ]),
        )
    )
        return;

    await sendMessageToBackground({
        type: "add-ng-id",
        data: formatNgId(videoId, title, settings),
    });
}

async function onClickNgUserButton() {
    const settings = useStorageStore.getState().settings;
    const userId = useStorageStore.getState().log?.tab?.userId;
    const userName = useStorageStore.getState().log?.tab?.userName;

    // メインリクエストからユーザ名を抽出する場合はユーザーが削除済みでも存在するためどちらも弾く
    if (userId === undefined || userName === undefined) {
        alert(messages.ngUserId.getInfoFailed);
        return;
    }
    if (
        !confirm(
            replace(messages.ngUserId.confirmAddition, [
                `${userId} (${userName})`,
            ]),
        )
    )
        return;

    await sendMessageToBackground({
        type: "add-ng-id",
        data: formatNgId(userId.toString(), userName, settings),
    });
}
