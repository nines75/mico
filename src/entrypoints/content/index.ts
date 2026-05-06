import { mountToDropdown } from "./dropdown";
import { defineContentScript } from "#imports";
import {
  catchAsync,
  isRankingPage,
  isSearchPage,
  isWatchPage,
} from "@/utils/util";
import { proxy } from "@/utils/proxy";
import { getLogId } from "@/utils/log";
import { onMessage } from "@/utils/messaging";
import { reload } from "@/utils/dom";

export default defineContentScript({
  matches: ["https://www.nicovideo.jp/*"],

  main() {
    const observer = new MutationObserver(catchAsync(onBodyChange));
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // ブラウザの進む/戻るで消えたバッジを復元
    if (isRankingPage(location.href) || isSearchPage(location.href)) {
      window.addEventListener(
        "pageshow",
        catchAsync(async (event) => {
          // キャッシュによる発火か判定
          if (!event.persisted) return;

          const tab = await proxy.getActiveTab();
          const tabId = tab?.id;
          const logId = getLogId();
          if (tabId === undefined || logId === undefined) return;

          const log = await proxy.getLog(logId);
          const count = log?.count?.blockedVideo;
          if (count === undefined) return;

          await proxy.setBadgeState(count, tabId, "video");
        }),
      );
    }
  },
});

async function onBodyChange(records: MutationRecord[]) {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue;

      // ドロップダウン
      if (isWatchPage(location.href) && node.className === "z_dropdown") {
        await mountToDropdown();

        continue;
      }
    }
  }
}

// -------------------------------------------------------------------------------------------
// メッセージリスナー登録
// -------------------------------------------------------------------------------------------

onMessage("reload", reload);
onMessage("getLogId", getLogId);

onMessage("mountLogId", ({ data: logId }) => {
  const id = `${browser.runtime.getManifest().name}-log-id`;
  const current = document.querySelector(`#${id}`);

  if (current === null) {
    const div = document.createElement("div");
    div.style.display = "none";
    div.id = id;
    div.textContent = logId;

    document.body.append(div);
  } else {
    current.textContent = logId;
  }
});

onMessage("setPlaybackTime", ({ data: time }) => {
  const id = setInterval(() => {
    const video = document.querySelector("video");
    if (video !== null) {
      clearInterval(id);

      video.currentTime = time;
    }
  }, 10);
});
