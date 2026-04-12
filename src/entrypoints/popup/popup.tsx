import { useEffect } from "react";
import Count from "./components/Count";
import { messages, urls, titles } from "@/utils/config";
import { useStorageStore, storageChangeHandler } from "@/utils/store";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { ScreenShareOff, SettingsIcon, UserX } from "lucide-react";
import { useShallow } from "zustand/shallow";
import type { FilterTab } from "@/types/storage/settings.types";
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
                            onClick={catchAsync(onClickNgVideo)}
                        >
                            <ScreenShareOff size={28} />
                        </button>
                        <button
                            className="ng-button"
                            title={titles.addNgUserIdByVideo}
                            onClick={catchAsync(onClickNgOwner)}
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
                                "button",
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
            <Count {...{ selectedTab }} />
        </main>
    );
}

async function onClickNgVideo() {
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
        type: "add-auto-rule",
        data: [
            {
                pattern: videoId,
                context: `video-title: ${title}`,
                source: "popup",
                target: { videoId: true },
            },
        ],
    });
}

async function onClickNgOwner() {
    const ownerId = useStorageStore.getState().log?.tab?.userId;
    const ownerName = useStorageStore.getState().log?.tab?.userName;

    // メインリクエストからユーザ名を抽出する場合はユーザーが削除済みでも存在するためどちらも弾く
    if (ownerId === undefined || ownerName === undefined) {
        alert(messages.ngUserId.getInfoFailed);
        return;
    }
    if (
        !confirm(
            replace(messages.ngUserId.confirmAddition, [
                `${ownerId} (${ownerName})`,
            ]),
        )
    )
        return;

    await sendMessageToBackground({
        type: "add-auto-rule",
        data: [
            {
                pattern: ownerId,
                context: `owner-name: ${ownerName}`,
                source: "popup",
                target: { videoOwnerId: true },
            },
        ],
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
} as const satisfies {
    tab: {
        id: FilterTab;
        name: string;
    }[];
};
