import { attributes, messages, selectors, titles } from "@/utils/config.js";
import { createElement, ScreenShareOff, UserX } from "lucide";

export function mountToRecommendHandler(parent: HTMLElement) {
    const elements = parent.querySelectorAll(selectors.recommendAnchor);

    for (const element of elements) {
        mountToRecommend(element);
    }
}

export function mountToRecommend(element: Element) {
    if (!(element instanceof HTMLAnchorElement)) return;

    const videoId = element.getAttribute(attributes.recommendVideoId);
    if (videoId === null) return;

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
                        id: videoId,
                        allId: getVideoIds(parent), // レンダリング時には他の関連動画がレンダリングされていない可能性があるためクリック時に取得する
                    } satisfies {
                        id: string;
                        allId: string[];
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
                        id: videoId,
                    } satisfies {
                        id: string;
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
    const elements = parent.querySelectorAll(selectors.recommendAnchor);

    return [...elements]
        .map((element) => element.getAttribute(attributes.recommendVideoId))
        .filter((id) => id !== null);
}
