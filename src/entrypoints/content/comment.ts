import { Settings } from "@/types/storage/settings.types.js";

export function renderComment(element: HTMLElement, settings: Settings) {
    const commentContent = getCommentContent(element);
    if (commentContent === undefined) return;

    const cnt = Number(commentContent.nicoru);
    const [nicoruElement, textElement, timeElement] = [
        commentContent.nicoruElement,
        commentContent.textElement,
        commentContent.timeElement,
    ];

    const id = (() => {
        for (const count of settings.nicoruCounts) {
            if (cnt >= count) return count;
        }
    })();
    if (id === undefined) return; // ここで装飾対象外のコメントを弾く

    const subElement = element.querySelector("div");
    if (subElement === null) return;

    const nicoruColor = settings.nicoruColors[id];

    const isGradate = nicoruColor?.isGradate ?? false;
    const primary = nicoruColor?.primary ?? "";
    const secondary = nicoruColor?.secondary ?? "";

    // 文字色/文字サイズを変更
    nicoruElement.style.color = "black";
    textElement.style.color = "black";
    textElement.style.fontSize = "16px";
    timeElement.style.color = "dimgray";

    // 背景色を変更
    if (isGradate) {
        subElement.style.background = `linear-gradient(to bottom right, ${primary}, ${secondary})`;
    } else {
        subElement.style.background = primary;
    }
}

export interface CommentContent {
    textElement: HTMLParagraphElement;
    text: string;
    nicoruElement: HTMLParagraphElement;
    nicoru: string;
    timeElement: HTMLSpanElement;
    time: string;
}

export function getCommentContent(
    element: HTMLElement,
): CommentContent | undefined {
    // コメント本文
    const textElement = element.querySelector(":scope > div > div > p");
    // ニコられた数のテキスト
    const nicoruElement = element.querySelector(":scope > div > button > p");
    // タイムスタンプのテキスト
    const timeElement = element.querySelector(":scope > div > div > p > span");

    if (
        !(textElement instanceof HTMLParagraphElement) ||
        !(nicoruElement instanceof HTMLParagraphElement) ||
        !(timeElement instanceof HTMLSpanElement)
    )
        return;

    const text = textElement.textContent;
    const nicoru = nicoruElement.textContent;
    const time = timeElement.textContent;

    if (text === null || nicoru === null || time === null) return;

    return {
        textElement,
        text,
        nicoruElement,
        nicoru,
        timeElement,
        time,
    };
}
