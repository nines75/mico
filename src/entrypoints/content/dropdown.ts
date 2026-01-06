import { sendMessageToBackground } from "@/utils/browser";
import { buttons, messages } from "@/utils/config";
import { catchAsync, replace } from "@/utils/util";

interface DropdownContent {
    buttonsParentElement: HTMLDivElement;
    sampleButtonElement: HTMLButtonElement;
    commentNoText: string;
    body: string;
    isOwner: boolean;
}

export interface DropdownComment {
    commentNo: number;
    body: string;
    isOwner: boolean;
}

export async function mountToDropdown(element: Element) {
    const dropdownContent = getDropdownContent(element);
    if (dropdownContent === undefined) return;

    const commentNo = /(\d+)$/.exec(dropdownContent.commentNoText)?.[1];
    if (commentNo === undefined) return;

    const dropdownComment: DropdownComment = {
        commentNo: Number(commentNo),
        body: dropdownContent.body,
        isOwner: dropdownContent.isOwner,
    };

    appendButton(
        dropdownContent,
        buttons.addNgUserId,
        getNgButtonCallback(dropdownComment, false),
    );
    appendButton(
        dropdownContent,
        buttons.addSpecificNgUserId,
        getNgButtonCallback(dropdownComment, true),
    );
    appendButton(
        dropdownContent,
        buttons.showComments,
        catchAsync(async () => {
            const comments = (await sendMessageToBackground({
                type: "get-comments-from-dropdown",
                data: dropdownComment,
            })) as string | undefined;
            if (comments === undefined) {
                await sendMessageToBackground({
                    type: "send-notification",
                    data: messages.other.getCommentFailed,
                });
                return;
            }

            alert(comments);
        }),
    );

    await sendMessageToBackground({
        type: "mount-to-dropdown",
        data: dropdownComment,
    });
}

function appendButton(
    dropdownContent: DropdownContent,
    textContent: string,
    callback: () => void,
) {
    const button = document.createElement("button");

    button.addEventListener("click", callback);
    button.textContent = replace(textContent, [
        browser.runtime.getManifest().name,
    ]);
    [...dropdownContent.sampleButtonElement.attributes].forEach((attribute) => {
        button.setAttribute(attribute.name, attribute.value);
    });

    dropdownContent.buttonsParentElement.appendChild(button);
}

function getNgButtonCallback(
    dropdownComment: DropdownComment,
    isSpecific: boolean,
) {
    return catchAsync(async () => {
        await sendMessageToBackground({
            type: "add-ng-user-id-from-dropdown",
            data: {
                ...dropdownComment,
                isSpecific,
            },
        });
    });
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
