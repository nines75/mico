import type { ContentScriptContext } from "#imports";
import { createIframeUi } from "#imports";
import type { LogId } from "@/types/storage/log.types";
import { sendMessageToBackground } from "@/utils/browser";

type ExtractData<T extends Extract<ContentMessage, { data: unknown }>["type"]> =
    Extract<ContentMessage, { type: T }>["data"];

export type ContentMessage =
    | {
          type: "reload";
      }
    | {
          type: "set-playback-time";
          data: number;
      }
    | {
          type: "quick-edit";
      }
    | {
          type: "mount-to-dropdown";
          data: string[];
      }
    | {
          type: "remove-old-search";
          data: Set<string>;
      }
    | {
          type: "mount-log-id";
          data: LogId;
      }
    | {
          type: "get-log-id";
      };

export function createContentMessageHandler(context: ContentScriptContext) {
    return async (
        message: ContentMessage,
        sender: browser.runtime.MessageSender,
    ) => {
        // エラーの発生箇所を出力するためにメッセージ受信側でエラーを出力
        try {
            if (sender.id !== browser.runtime.id) return;

            switch (message.type) {
                case "reload": {
                    await reload();
                    break;
                }
                case "set-playback-time": {
                    setPlaybackTime(message.data);
                    break;
                }
                case "quick-edit": {
                    openQuickEdit(context);
                    break;
                }
                case "mount-to-dropdown": {
                    mountToDropdown(message.data);
                    break;
                }
                case "remove-old-search": {
                    removeOldSearch(message.data);
                    break;
                }
                case "mount-log-id": {
                    mountLogId(message.data);
                    break;
                }
                case "get-log-id": {
                    return getLogId();
                }
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };
}

async function reload() {
    const video = document.querySelector("video");
    if (video === null) return;

    await sendMessageToBackground({
        type: "set-tab-data",
        data: {
            playbackTime: Math.floor(video.currentTime),
        },
    });

    location.reload();
}

function setPlaybackTime(time: ExtractData<"set-playback-time">) {
    const id = setInterval(() => {
        const video = document.querySelector("video");
        if (video !== null) {
            clearInterval(id);

            video.currentTime = time;
        }
    }, 10);
}

function openQuickEdit(context: ContentScriptContext) {
    const id = `${browser.runtime.getManifest().name}-quick-edit`;
    if (document.querySelector(`#${id}`) !== null) return;

    const callback = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;

        ui.remove();
    };
    const ui = createIframeUi(context, {
        page: "/quick-edit.html",
        position: "modal",
        zIndex: 2_147_483_647, // 最大値
        onMount: (_, iframe) => {
            iframe.id = id;
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.color = "rgba(10, 10, 10, 0.6)"; // 指定しないとサイト内のCSSの影響で枠線が表示されることがある
            iframe.addEventListener("load", () => {
                // iframe内の要素にfocusがある場合に反応するショートカットを設定
                iframe.contentDocument?.addEventListener("keydown", callback);

                // 背景をクリックしたらiframeを閉じる
                const body = iframe.contentDocument?.body;
                if (body !== undefined) {
                    body.addEventListener("click", (event) => {
                        // クリックしたのが背景要素自体か判定
                        if (event.target === body) ui.remove();
                    });
                }

                // エディタにフォーカスを当てる
                const intervalId = setInterval(() => {
                    const element =
                        iframe.contentDocument?.querySelector(".cm-content");
                    const iframeDivElement =
                        element?.ownerDocument.defaultView?.HTMLDivElement; // iframe内の要素がdivか判定するにはiframeのHTMLDivElementが必要

                    if (
                        iframeDivElement !== undefined &&
                        element instanceof iframeDivElement
                    ) {
                        element.focus();
                        clearInterval(intervalId);
                    }
                }, 10);
            });
        },
        onRemove: () => {
            // iframe外のリスナーは自動で消えないのでここで消す
            document.removeEventListener("keydown", callback);
        },
    });

    ui.mount();

    // iframe外の要素にfocusがある場合に反応するショートカットを設定
    document.addEventListener("keydown", callback);
}

function mountToDropdown(texts: ExtractData<"mount-to-dropdown">) {
    const parent = document.querySelector(".z_dropdown > div");
    if (parent === null) return;

    const sample = parent.querySelector(":scope > div:nth-child(2)");
    const buttons = parent.querySelector(":scope > div:last-of-type");
    if (sample === null || buttons === null) return;

    for (const text of texts) {
        const div = document.createElement("div");
        div.textContent = `${text} (${browser.runtime.getManifest().name})`;
        for (const attribute of sample.attributes) {
            div.setAttribute(attribute.name, attribute.value);
        }

        buttons.before(div);
    }
}

export function removeOldSearch(ids: ExtractData<"remove-old-search">) {
    const elements =
        document.querySelectorAll<HTMLLIElement>("li[data-video-id]");
    for (const element of elements) {
        const videoId = element.dataset.videoId;
        if (videoId === undefined) continue;

        if (ids.has(videoId) && element instanceof HTMLElement) {
            element.style.display = "none";
        }
    }
}

function mountLogId(logId: ExtractData<"mount-log-id">) {
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
}

function getLogId() {
    const id = `${browser.runtime.getManifest().name}-log-id`;
    const element = document.querySelector(`#${id}`);

    return element?.textContent;
}
