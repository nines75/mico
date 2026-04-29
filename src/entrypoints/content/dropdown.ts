import { sendMessage } from "@/utils/browser";
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
      text: "ユーザーをNG登録($1)",
      callback: async () => {
        await sendMessage({ type: "on-click-dropdown" });
      },
    },
    {
      text: "この動画だけユーザーをNG登録($1)",
      callback: async () => {
        await sendMessage({
          type: "on-click-dropdown",
          data: { videoOnly: true },
        });
      },
    },
    {
      text: "ユーザーが投稿したコメント($1)",
      callback: async () => {
        const comments = (await sendMessage({
          type: "get-comments-for-dropdown",
        })) as string | undefined;
        if (comments === undefined) {
          await sendMessage({
            type: "notify",
            data: "コメントの取得に失敗しました",
          });
          return;
        }

        alert(comments);
      },
    },
  ]);

  await sendMessage({ type: "mount-to-dropdown" });
}

function appendButton(
  dropdownContent: DropdownContent,
  data: { text: string; callback: () => Promise<void> }[],
) {
  for (const { text, callback } of data) {
    const button = document.createElement("button");

    button.addEventListener("click", catchAsync(callback));
    button.textContent = replace(text, [browser.runtime.getManifest().name]);
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
