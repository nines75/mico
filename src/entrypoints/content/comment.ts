import type { Settings } from "@/types/storage/settings.types";

export function renderComment(element: Element, settings: Settings) {
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

    const subElement = element.querySelector(":scope > div");
    if (!(subElement instanceof HTMLElement)) return;

    const nicoruColor = settings.nicoruColors[id];

    const isGradient = nicoruColor?.isGradient ?? false;
    const primary = nicoruColor?.primary ?? "";
    const secondary = nicoruColor?.secondary ?? "";

    // 文字色を変更
    nicoruElement.style.color = "black";
    textElement.style.color = "black";
    timeElement.style.color = "dimgray";

    // コメント本文を強調
    if (settings.isCommentBodyHighlighted) {
        textElement.style.fontSize = "16px";
    }

    // 背景色を変更
    if (isGradient) {
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
    element: Element,
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

    return {
        textElement,
        text,
        nicoruElement,
        nicoru,
        timeElement,
        time,
    };
}
