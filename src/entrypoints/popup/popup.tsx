import { useEffect } from "react";
import Count from "./components/Count";
import { useStorageStore } from "@/utils/store";
import {
  History,
  RotateCw,
  ScreenShareOff,
  SettingsIcon,
  UserX,
} from "lucide-react";
import { catchAsync, isWatchPage } from "@/utils/util";
import {
  sendMessage,
  notify,
  getActiveTab,
  sendMessageToTab,
} from "@/utils/browser";
import { openLog } from "@/utils/log";

const TOOL_SIZE = 30;

export function Init() {
  const isLoading = useStorageStore((state) => state.isLoading);

  useEffect(() => {
    useStorageStore.getState().loadPopup();
  }, []);

  if (isLoading) return null;

  return <Page />;
}

function Page() {
  const name = browser.runtime.getManifest().name;
  const version = `v${browser.runtime.getManifest().version}`;
  const state = useStorageStore.getState();

  return (
    <>
      <header>
        <span className="version">{`${name} ${version}`}</span>
      </header>
      <main>
        <Count />
      </main>
      <div className="tools">
        {state.isWatchPage && (
          <>
            <button
              className="tool"
              title="この動画をNG登録"
              onClick={catchAsync(onClickNgVideo)}
            >
              <ScreenShareOff size={TOOL_SIZE} />
            </button>
            <button
              className="tool"
              title="この動画の投稿者をNG登録"
              onClick={catchAsync(onClickNgOwner)}
            >
              <UserX size={TOOL_SIZE} />
            </button>
            <button
              className="tool"
              title="リロードして現在の再生時間を復元"
              onClick={catchAsync(reload)}
            >
              <RotateCw size={TOOL_SIZE} />
            </button>
          </>
        )}
        <button
          className="tool"
          title="ログを開く"
          onClick={catchAsync(openLog)}
        >
          <History size={TOOL_SIZE} />
        </button>
        <a
          className="tool"
          href="/options.html"
          target="_blank"
          title="設定を開く"
        >
          <SettingsIcon size={TOOL_SIZE} />
        </a>
      </div>
    </>
  );
}

async function onClickNgVideo() {
  const videoId = useStorageStore.getState().log?.tab?.videoId;
  const title = useStorageStore.getState().log?.tab?.title;

  if (videoId === undefined || title === undefined) {
    alert("NG登録に失敗しました");
    return;
  }

  await sendMessage({
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
  await notify(`以下の動画IDをNG登録しました\n\n${videoId} (${title})`);
}

async function onClickNgOwner() {
  const ownerId = useStorageStore.getState().log?.tab?.ownerId;
  const ownerName = useStorageStore.getState().log?.tab?.ownerName;

  // メインリクエストからユーザ名を抽出する場合はユーザーが削除済みでも存在するためどちらも弾く
  if (ownerId === undefined || ownerName === undefined) {
    alert("NG登録に失敗しました");
    return;
  }

  await sendMessage({
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
  await notify(`以下のユーザーIDをNG登録しました\n\n${ownerId} (${ownerName})`);
}

export async function reload() {
  const tab = await getActiveTab();
  const tabId = tab?.id;
  if (tabId === undefined || !isWatchPage(tab?.url)) return;

  await sendMessageToTab(tabId, { type: "reload" });
}
