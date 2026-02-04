import { useEffect } from "react";
import Count from "./components/Count";
import type { CommentLogViewerProps } from "./components/CommentLogViewer";
import CommentLogViewer from "./components/CommentLogViewer";
import ProcessingTime from "./components/ProcessingTime";
import { messages, urls, titles } from "@/utils/config";
import { useStorageStore, storageChangeHandler } from "@/utils/store";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { ScreenShareOff, SettingsIcon, UserX } from "lucide-react";
import { useShallow } from "zustand/shallow";
import type { VideoLogViewerProps } from "./components/VideoLogViewer";
import VideoLogViewer from "./components/VideoLogViewer";
import Details from "./components/Details";
import type { FilterTab } from "@/types/storage/settings.types";
import { formatNgId } from "../background/video-filter/filter/id-filter";
import clsx from "clsx";
import { catchAsync, replace } from "@/utils/util";
import { sendMessageToBackground } from "@/utils/browser";

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
                    {config.tab.map((filter) => (
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
                            {filter.name}
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
                        case "commentFilter": {
                            return config.commentFilter.log.map((log) => (
                                <CommentLogViewer key={log.id} {...log} />
                            ));
                        }
                        case "videoFilter": {
                            return config.videoFilter.log.map((log) => (
                                <VideoLogViewer key={log.id} {...log} />
                            ));
                        }
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
        data: formatNgId(userId, userName, settings),
    });
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

const config = {
    tab: [
        {
            id: "commentFilter",
            name: "コメントフィルター",
        },
        {
            id: "videoFilter",
            name: "動画フィルター",
        },
    ],
    commentFilter: {
        log: [
            {
                id: "userIdFilter",
                name: "NGユーザーID",
            },
            {
                id: "easyCommentFilter",
                name: "かんたんコメント",
            },
            {
                id: "commentAssistFilter",
                name: "コメントアシスト",
            },
            {
                id: "scoreFilter",
                name: "NGスコア",
            },
            {
                id: "commandFilter",
                name: "NGコマンド",
            },
            {
                id: "wordFilter",
                name: "NGワード",
            },
        ],
    },
    videoFilter: {
        log: [
            {
                id: "idFilter",
                name: "NGユーザーID/動画ID",
            },
            {
                id: "paidFilter",
                name: "有料動画",
            },
            {
                id: "viewsFilter",
                name: "再生回数",
            },
            {
                id: "userNameFilter",
                name: "NGユーザー名",
            },
            {
                id: "titleFilter",
                name: "NGタイトル",
            },
        ],
    },
} as const satisfies {
    tab: {
        id: FilterTab;
        name: string;
    }[];
    commentFilter: {
        log: CommentLogViewerProps[];
    };
    videoFilter: {
        log: VideoLogViewerProps[];
    };
};
