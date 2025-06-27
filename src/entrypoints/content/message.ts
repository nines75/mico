import { ContentScriptContext, createIframeUi } from "#imports";
import { attributes } from "@/utils/config.js";
import { extractVideoId } from "@/utils/util.js";

export interface Message {
    type: string;
    data: unknown;
}

export function createContentMessageHandler(ctx: ContentScriptContext) {
    return (message: Message, sender: browser.runtime.MessageSender) => {
        if (sender.id !== browser.runtime.id) return;

        if (message.type === "reload") reload(message.data as number);
        if (message.type === "focus-player") focusPlayer();
        if (message.type === "set-playback-time")
            setPlaybackTime(message.data as number);
        if (message.type === "quick-edit") openQuickEdit(ctx);
        if (message.type === "mount-user-id")
            mountUserId(message.data as string);
        if (message.type === "remove-recommend")
            removeRecommend(message.data as string[]);
    };
}

function reload(tabId: number) {
    const id = setInterval(async () => {
        try {
            const video = document.querySelector("video");
            if (video !== null) {
                clearInterval(id);

                const videoId = extractVideoId(location.href);
                if (videoId === undefined) return;

                await browser.runtime.sendMessage({
                    type: "save-playback-time",
                    data: {
                        tabId,
                        time: Math.floor(video.currentTime),
                    } satisfies {
                        tabId: number;
                        time: number;
                    },
                });

                location.reload();
            }
        } catch (e) {
            console.error(e);
        }
    }, 10);
}

function focusPlayer() {
    const player = document.querySelector(
        "div[class='grid-area_[player]'] > div > div > div > div",
    );

    if (player instanceof HTMLDivElement) player.focus();
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
    p.textContent = userId;
    [...sampleElement.attributes].forEach((attribute) => {
        p.setAttribute(attribute.name, attribute.value);
    });

    dropdown.appendChild(p);
}

function removeRecommend(ids: string[]) {
    const elements = document.querySelectorAll(
        "a[data-anchor-area='related_content,recommendation'][href^='/watch/']",
    );
    const idsSet = new Set(ids);

    for (const element of elements) {
        const videoId = element.getAttribute(attributes.recommendVideoId);
        if (videoId === null || !(element instanceof HTMLAnchorElement))
            continue;

        if (idsSet.has(videoId)) {
            element.style.display = "none";
        }
    }
}
