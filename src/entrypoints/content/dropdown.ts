import { Settings } from "@/types/storage/settings.types.js";
import { pattern, texts, selectors } from "@/utils/config.js";
import { extractVideoId } from "@/utils/util.js";

interface DropdownContent {
    buttonsParentElement: HTMLDivElement;
    sampleButtonElement: HTMLButtonElement;
    commentNoText: string;
}

export async function mountContentToDropdown(
    element: HTMLElement,
    settings: Settings,
) {
    const dropdownContent = getDropdownContent(element);
    if (dropdownContent === undefined) return;

    const commentNo = dropdownContent.commentNoText.match(
        pattern.regex.extractCommentNo,
    )?.[1];
    if (commentNo === undefined) return;

    appendButton(
        dropdownContent,
        commentNo,
        texts.content.textAddNgUserIdButton,
        false,
    );
    appendButton(
        dropdownContent,
        commentNo,
        texts.content.textAddSpecificNgUserIdButton,
        true,
    );

    if (settings.isShowUserIdInDropdown) {
        await browser.runtime.sendMessage({
            type: "get-user-id",
            data: Number(commentNo) satisfies number,
        });
    }
}

function appendButton(
    dropdownContent: DropdownContent,
    commentNo: string,
    textContent: string,
    specific: boolean,
) {
    const button = document.createElement("button");

    button.textContent = textContent.replace(
        "{target}",
        browser.runtime.getManifest().name,
    );
    [...dropdownContent.sampleButtonElement.attributes].forEach((attribute) => {
        button.setAttribute(attribute.name, attribute.value);
    });

    button.addEventListener("click", getButtonCallback(commentNo, specific));

    dropdownContent.buttonsParentElement.appendChild(button);
}

function getButtonCallback(commentNo: string, specific: boolean) {
    return async () => {
        try {
            const videoId = extractVideoId(location.href);
            if (videoId === undefined) return;

            await browser.runtime.sendMessage({
                type: "save-ng-user-id",
                data: {
                    videoId,
                    commentNo: Number(commentNo),
                    specific,
                } satisfies {
                    videoId: string;
                    commentNo: number;
                    specific: boolean;
                },
            });
        } catch (e) {
            console.error(e);
        }
    };
}

function getDropdownContent(element: HTMLElement): DropdownContent | undefined {
    const buttonsParentElement = element.querySelector(
        selectors.dropdownButtonsParent,
    );
    const commentNoElement = element.querySelector(selectors.dropdownCommentNo);
    if (
        !(buttonsParentElement instanceof HTMLDivElement) ||
        !(commentNoElement instanceof HTMLParagraphElement)
    )
        return;

    const sampleButtonElement = buttonsParentElement.querySelector(
        selectors.dropdownButtonSample,
    );
    if (!(sampleButtonElement instanceof HTMLButtonElement)) return;

    const commentNoText = commentNoElement.textContent;
    if (commentNoText === null) return;

    return {
        buttonsParentElement,
        sampleButtonElement,
        commentNoText,
    };
}
