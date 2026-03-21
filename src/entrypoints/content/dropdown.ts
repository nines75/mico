import { sendMessageToBackground } from "@/utils/browser";
import { buttons, messages } from "@/utils/config";
import { catchAsync, replace } from "@/utils/util";

interface DropdownContent {
    parent: HTMLDivElement;
    button: HTMLButtonElement;
}

export async function mountToDropdown(element: Element) {
    const dropdownContent = getDropdownContent(element);
    if (dropdownContent === undefined) return;

    appendButton(dropdownContent, [
        {
            text: buttons.addNgUserId,
            callback: async () => {
                await sendMessageToBackground({
                    type: "add-ng-user-id-from-dropdown",
                    data: { isSpecific: false },
                });
            },
        },
        {
            text: buttons.addSpecificNgUserId,
            callback: async () => {
                await sendMessageToBackground({
                    type: "add-ng-user-id-from-dropdown",
                    data: { isSpecific: true },
                });
            },
        },
        {
            text: buttons.showComments,
            callback: async () => {
                const comments = (await sendMessageToBackground({
                    type: "get-comments-for-dropdown",
                })) as string | undefined;
                if (comments === undefined) {
                    await sendMessageToBackground({
                        type: "send-notification",
                        data: messages.other.getCommentFailed,
                    });
                    return;
                }

                alert(comments);
            },
        },
    ]);

    await sendMessageToBackground({ type: "mount-to-dropdown" });
}

function appendButton(
    dropdownContent: DropdownContent,
    data: { text: string; callback: () => Promise<void> }[],
) {
    for (const { text, callback } of data) {
        const button = document.createElement("button");

        button.addEventListener("click", catchAsync(callback));
        button.textContent = replace(text, [
            browser.runtime.getManifest().name,
        ]);
        for (const attribute of dropdownContent.button.attributes) {
            button.setAttribute(attribute.name, attribute.value);
        }

        dropdownContent.parent.append(button);
    }
}

function getDropdownContent(element: Element): DropdownContent | undefined {
    const parent = element.querySelector(":scope > div > div:last-of-type");
    if (!(parent instanceof HTMLDivElement)) return;

    const button = parent.querySelector(":scope > button");
    if (!(button instanceof HTMLButtonElement)) return;

    return {
        parent,
        button,
    };
}
