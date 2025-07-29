import { Settings } from "@/types/storage/settings.types.js";
import { buttons } from "@/utils/config.js";

interface DropdownContent {
    buttonsParentElement: HTMLDivElement;
    sampleButtonElement: HTMLButtonElement;
    commentNoText: string;
}

export async function mountToDropdown(element: Element, settings: Settings) {
    const dropdownContent = getDropdownContent(element);
    if (dropdownContent === undefined) return;

    const commentNo = dropdownContent.commentNoText.match(/(\d+)$/)?.[1];
    if (commentNo === undefined) return;

    appendButton(dropdownContent, commentNo, buttons.AddNgUserId, false);
    appendButton(dropdownContent, commentNo, buttons.AddSpecificNgUserId, true);

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
        await browser.runtime.sendMessage({
            type: "save-ng-user-id",
            data: {
                commentNo: Number(commentNo),
                specific,
            } satisfies {
                commentNo: number;
                specific: boolean;
            },
        });
    };
}

function getDropdownContent(element: Element): DropdownContent | undefined {
    const buttonsParentElement = element.querySelector(
        ":scope > div > div:last-of-type",
    );
    const commentNoElement = element.querySelector(
        ":scope > div > div:nth-child(2) > p:last-of-type",
    );
    if (
        !(buttonsParentElement instanceof HTMLDivElement) ||
        !(commentNoElement instanceof HTMLParagraphElement)
    )
        return;

    const sampleButtonElement =
        buttonsParentElement.querySelector(":scope > button");
    if (!(sampleButtonElement instanceof HTMLButtonElement)) return;

    const commentNoText = commentNoElement.textContent;
    if (commentNoText === null) return;

    return {
        buttonsParentElement,
        sampleButtonElement,
        commentNoText,
    };
}
