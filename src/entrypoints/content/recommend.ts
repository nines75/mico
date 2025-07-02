import { attributes, messages, titles } from "@/utils/config.js";
import { createElement, ScreenShareOff, UserX } from "lucide";

interface recommendContent {
    title: string;
    userName: string | undefined;
}

export function mountToRecommendHandler(parent: HTMLElement) {
    for (const element of getAnchors(parent)) {
        mountToRecommend(element);
    }
}

export function mountToRecommend(element: Element) {
    if (!(element instanceof HTMLAnchorElement)) return;

    const videoId = element.getAttribute(attributes.recommendVideoId);
    const recommendContent = getRecommendContent(element);
    if (videoId === null || recommendContent === undefined) return;

    // ボタンの配置にabsoluteを使うために必要
    element.style.position = "relative";

    appendButton(
        element,
        10,
        createElement(UserX),
        titles.addNgUserIdByVideo,
        async (event) => {
            try {
                event.preventDefault();

                if (!confirm(messages.ngUserId.confirmAdditionByVideo)) return;

                const parent = element.parentElement;
                if (parent === null) return;

                await browser.runtime.sendMessage({
                    type: "save-ng-id",
                    data: {
                        userId: {
                            id: videoId,
                            userName: recommendContent.userName,
                            allId: getVideoIds(parent), // レンダリング時には他の関連動画がレンダリングされていない可能性があるためクリック時に取得する
                        },
                    } satisfies {
                        userId: {
                            id: string;
                            userName: string | undefined;
                            allId: string[];
                        };
                    },
                });
            } catch (e) {
                console.error(e);
            }
        },
    );

    appendButton(
        element,
        40,
        createElement(ScreenShareOff),
        titles.addNgVideo,
        async (event) => {
            try {
                event.preventDefault();
                if (!confirm(messages.ngVideoId.confirmAddition)) return;

                element.style.display = "none";

                await browser.runtime.sendMessage({
                    type: "save-ng-id",
                    data: {
                        video: {
                            id: videoId,
                            title: recommendContent.title,
                        },
                    } satisfies {
                        video: {
                            id: string;
                            title: string;
                        };
                    },
                });
            } catch (e) {
                console.error(e);
            }
        },
    );
}

function appendButton(
    element: HTMLElement,
    right: number,
    svg: SVGElement,
    title: string,
    callback: (event: MouseEvent) => Promise<void>,
) {
    const button = document.createElement("button");
    button.style.position = "absolute";
    button.style.bottom = "2px";
    button.style.right = `${right}px`;
    button.style.cursor = "pointer";
    button.title = `${title}(${browser.runtime.getManifest().name})`;

    const size = "22";
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    button.appendChild(svg);

    button.addEventListener("click", callback);

    element.appendChild(button);
}

function getVideoIds(parent: HTMLElement) {
    return [...getAnchors(parent)]
        .map((element) => element.getAttribute(attributes.recommendVideoId))
        .filter((id) => id !== null);
}

function getAnchors(parent: HTMLElement) {
    return parent.querySelectorAll(":scope > a[href^='/watch/']");
}

function getRecommendContent(
    parent: HTMLElement,
): recommendContent | undefined {
    const titleElement = parent.querySelector(":scope > div:nth-child(2) > p");
    const iconElement = parent.querySelector(
        "img[src^='https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon']",
    );

    // タイトル要素は必ず存在するが、アイコン要素はユーザーが削除済みであれば存在しない
    if (!(titleElement instanceof HTMLParagraphElement)) return;

    const title = titleElement.textContent;
    if (title === null) return;

    return {
        title,
        userName: iconElement?.getAttribute("alt") ?? undefined,
    };
}
