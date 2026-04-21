import { useEffect } from "react";
import Count from "./components/Count";
import { messages, urls, titles } from "@/utils/config";
import { useStorageStore } from "@/utils/store";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { History, ScreenShareOff, SettingsIcon, UserX } from "lucide-react";
import { catchAsync } from "@/utils/util";
import { sendMessageToBackground, sendNotification } from "@/utils/browser";
import { openLog } from "@/utils/log";

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

    return (
        <>
            <header>
                <span id="version">{`${name} ${version}`}</span>
                <div className="link-container">
                    <a className="link" href={urls.repository}>
                        <SiGithub size={24} />
                    </a>
                    <button
                        className="link"
                        title="ログを開く"
                        onClick={catchAsync(async () => {
                            await openLog();
                        })}
                    >
                        <History size={24} />
                    </button>
                    <a
                        className="link"
                        href="/options.html"
                        target="_blank"
                        title="設定を開く"
                    >
                        <SettingsIcon size={24} />
                    </a>
                </div>
            </header>
            <main>
                {useStorageStore.getState().isWatchPage && (
                    <section>
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
                <Count />
            </main>
        </>
    );
}

async function onClickNgVideo() {
    const videoId = useStorageStore.getState().log?.tab?.videoId;
    const title = useStorageStore.getState().log?.tab?.title;

    if (videoId === undefined || title === undefined) {
        alert(messages.ngVideoId.getInfoFailed);
        return;
    }

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
    await sendNotification(
        `以下の動画をNG登録しました\n\n${videoId} (${title})`,
    );
}

async function onClickNgOwner() {
    const ownerId = useStorageStore.getState().log?.tab?.ownerId;
    const ownerName = useStorageStore.getState().log?.tab?.ownerName;

    // メインリクエストからユーザ名を抽出する場合はユーザーが削除済みでも存在するためどちらも弾く
    if (ownerId === undefined || ownerName === undefined) {
        alert(messages.ngUserId.getInfoFailed);
        return;
    }

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
    await sendNotification(
        `以下のユーザーをNG登録しました\n\n${ownerId} (${ownerName})`,
    );
}
