import { mountToDropdown } from "./dropdown";
import { contentMessageHandler } from "./message";
import { defineContentScript } from "#imports";
import {
  catchAsync,
  isRankingPage,
  isSearchPage,
  isWatchPage,
} from "@/utils/util";
import { sendMessageToBackground } from "@/utils/browser";

export default defineContentScript({
  matches: ["https://www.nicovideo.jp/*"],

  main() {
    const observer = new MutationObserver(catchAsync(observerCallback));
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    browser.runtime.onMessage.addListener(contentMessageHandler);

    // ブラウザの進む/戻るで消えたバッジを復元
    if (isRankingPage(location.href) || isSearchPage(location.href)) {
      window.addEventListener(
        "pageshow",
        catchAsync(async (event) => {
          // キャッシュによる発火か判定
          if (!event.persisted) return;

          await sendMessageToBackground({
            type: "restore-badge",
          });
        }),
      );
    }
  },
});

async function observerCallback(records: MutationRecord[]) {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue;

      // ドロップダウン
      if (isWatchPage(location.href) && node.className === "z_dropdown") {
        await mountToDropdown(node);

        continue;
      }
    }
  }
}
