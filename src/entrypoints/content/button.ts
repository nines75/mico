import { titles, messages } from "@/utils/config.js";
import { createElement, ScreenShareOff, UserX } from "lucide";
import { NgIdMessage } from "../background/message.js";

interface VideoContent {
    title: string;
    userName: string | undefined;
}

interface Position {
    left?: number;
    right?: number;
    bottom: number;
}

export function mountButton(
    type: Required<NgIdMessage>["userId"]["type"],
    element: Element,
    videoId: string | null,
    videoIds: string[],
    videoContent: VideoContent | undefined,
    videoPosition: Position,
    userPosition: Position,
) {
    if (
        !(element instanceof HTMLElement) ||
        videoId === null ||
        videoContent === undefined
    )
        return;

    // ボタンの配置にabsoluteを使うために必要
    element.style.position = "relative";

    // 動画NGボタン
    appendButton(
        element,
        createElement(ScreenShareOff),
        titles.addNgVideo,
        videoPosition,
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
                            title: videoContent.title,
                        },
                    } satisfies NgIdMessage,
                });
            } catch (e) {
                console.error(e);
            }
        },
    );

    // ユーザーNGボタン
    appendButton(
        element,
        createElement(UserX),
        titles.addNgUserIdByVideo,
        userPosition,
        async (event) => {
            try {
                event.preventDefault();

                if (!confirm(messages.ngUserId.confirmAdditionByVideo)) return;

                await browser.runtime.sendMessage({
                    type: "save-ng-id",
                    data: {
                        userId: {
                            id: videoId,
                            allId: videoIds,
                            userName: videoContent.userName,
                            type,
                        },
                    } satisfies NgIdMessage,
                });
            } catch (e) {
                console.error(e);
            }
        },
    );
}

function appendButton(
    element: HTMLElement,
    svg: SVGElement,
    title: string,
    position: Position,
    callback: (event: MouseEvent) => Promise<void>,
) {
    const button = document.createElement("button");
    button.style.position = "absolute";
    button.style.cursor = "pointer";
    button.title = `${title}(${browser.runtime.getManifest().name})`;

    // 位置を設定
    if (position.left !== undefined) {
        button.style.left = `${position.left}px`;
    }
    if (position.right !== undefined) {
        button.style.right = `${position.right}px`;
    }
    button.style.bottom = `${position.bottom}px`;

    const size = "22";
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    button.appendChild(svg);

    button.addEventListener("click", callback);

    element.appendChild(button);
}

export function getVideoContent(parent: Element): VideoContent | undefined {
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
