import { ContentScriptContext, createIframeUi } from "#imports";
import { sendMessageToBackground } from "../background/message.js";

type ContentMessage =
    | {
          type: "reload";
          data: number;
      }
    | {
          type: "set-playback-time";
          data: number;
      }
    | {
          type: "quick-edit";
      }
    | {
          type: "mount-user-id";
          data: string;
      }
    | {
          type: "remove-old-search";
          data: Set<string>;
      };

export async function sendMessageToContent(
    tabId: number,
    message: ContentMessage,
) {
    await browser.tabs.sendMessage(tabId, message);
}

export function createContentMessageHandler(ctx: ContentScriptContext) {
    return (message: ContentMessage, sender: browser.runtime.MessageSender) => {
        // エラーの発生箇所を出力するためにメッセージ受信側でエラーを出力
        try {
            if (sender.id !== browser.runtime.id) return;

            switch (message.type) {
                case "reload": {
                    reload(message.data);
                    break;
                }
                case "set-playback-time": {
                    setPlaybackTime(message.data);
                    break;
                }
                case "quick-edit": {
                    openQuickEdit(ctx);
                    break;
                }
                case "mount-user-id": {
                    mountUserId(message.data);
                    break;
                }
                case "remove-old-search": {
                    removeOldSearch(message.data);
                    break;
                }
            }
        } catch (e) {
            console.error(e);
        }
    };
}

function reload(tabId: number) {
    const id = setInterval(async () => {
        const video = document.querySelector("video");
        if (video !== null) {
            clearInterval(id);

            await sendMessageToBackground({
                type: "save-playback-time",
                data: {
                    tabId,
                    time: Math.floor(video.currentTime),
                },
            });

            location.reload();
        }
    }, 10);
}

function setPlaybackTime(time: number) {
    const id = setInterval(() => {
        const video = document.querySelector("video");
        if (video !== null) {
            clearInterval(id);

            video.currentTime = time;
        }
    }, 10);
}

function openQuickEdit(ctx: ContentScriptContext) {
    const id = `${browser.runtime.getManifest().name}-quick-edit`;
    if (document.getElementById(id) !== null) return;

    const callback = (e: KeyboardEvent) => {
        if (e.key === "Escape") ui.remove();
    };
    const ui = createIframeUi(ctx, {
        page: "/quick-edit.html",
        position: "modal",
        zIndex: 2147483647, // 最大値
        onMount: (_, iframe) => {
            iframe.id = id;
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.addEventListener("load", () => {
                // iframe内の要素にfocusがある場合に反応するショートカットを設定
                iframe.contentDocument?.addEventListener("keydown", callback);

                // 背景をクリックしたらiframeを閉じる
                const body = iframe.contentDocument?.body;
                if (body !== undefined) {
                    body.addEventListener("click", (e) => {
                        // クリックしたのが背景要素自体か判定
                        if (e.target === body) ui.remove();
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

function mountUserId(userId: string) {
    const dropdown = document.querySelector(".z_dropdown > div > div > div");
    if (dropdown === null) return;

    const sampleElement = dropdown.querySelector(":scope > p:last-of-type");
    if (sampleElement === null) return;

    const p = document.createElement("p");
    p.textContent = `${userId} (${browser.runtime.getManifest().name})`;
    [...sampleElement.attributes].forEach((attribute) => {
        p.setAttribute(attribute.name, attribute.value);
    });

    dropdown.appendChild(p);
}

export function removeOldSearch(ids: Set<string>) {
    const elements = document.querySelectorAll("li[data-video-id]");
    elements.forEach((element) => {
        const videoId = element.getAttribute("data-video-id");
        if (videoId === null) return;

        if (ids.has(videoId) && element instanceof HTMLElement) {
            element.style.display = "none";
        }
    });
}
