import { Settings } from "@/types/storage/settings.types.js";
import { buttons } from "@/utils/config.js";
import { sendMessageToBackground } from "../background/message.js";

interface DropdownContent {
    buttonsParentElement: HTMLDivElement;
    sampleButtonElement: HTMLButtonElement;
    commentNoText: string;
    body: string;
    isOwner: boolean;
}

export async function mountToDropdown(element: Element, settings: Settings) {
    const dropdownContent = getDropdownContent(element);
    if (dropdownContent === undefined) return;

    const commentNo = dropdownContent.commentNoText.match(/(\d+)$/)?.[1];
    if (commentNo === undefined) return;

    appendButton(dropdownContent, commentNo, buttons.AddNgUserId, false);
    appendButton(dropdownContent, commentNo, buttons.AddSpecificNgUserId, true);

    if (settings.isUserIdMountedToDropdown) {
        await sendMessageToBackground({
            type: "get-user-id-for-mount",
            data: {
                commentNo: Number(commentNo),
                body: dropdownContent.body,
                isOwner: dropdownContent.isOwner,
            },
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

    button.addEventListener(
        "click",
        getButtonCallback(commentNo, specific, dropdownContent),
    );

    dropdownContent.buttonsParentElement.appendChild(button);
}

function getButtonCallback(
    commentNo: string,
    specific: boolean,
    dropdownContent: DropdownContent,
) {
    return async () => {
        await sendMessageToBackground({
            type: "add-ng-user-id-from-dropdown",
            data: {
                commentNo: Number(commentNo),
                body: dropdownContent.body,
                isOwner: dropdownContent.isOwner,
                specific,
            },
        });
    };
}

function getDropdownContent(element: Element): DropdownContent | undefined {
    const bodyElement = element.querySelector(":scope > div > div > div > p");
    const buttonsParentElement = element.querySelector(
        ":scope > div > div:last-of-type",
    );
    const commentNoElement = element.querySelector(
        ":scope > div > div:nth-child(2) > p:last-of-type",
    );
    const ownerElement = element.querySelector(
        ":scope > div > div > div > p:nth-child(2) > span:nth-child(2)",
    );
    if (
        !(bodyElement instanceof HTMLParagraphElement) ||
        !(buttonsParentElement instanceof HTMLDivElement) ||
        !(commentNoElement instanceof HTMLParagraphElement)
    )
        return;

    const sampleButtonElement =
        buttonsParentElement.querySelector(":scope > button");
    if (!(sampleButtonElement instanceof HTMLButtonElement)) return;

    const commentNoText = commentNoElement.textContent;

    return {
        buttonsParentElement,
        sampleButtonElement,
        commentNoText,
        body: bodyElement.textContent,
        isOwner: ownerElement?.textContent === "投稿者",
    };
}
