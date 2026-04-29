import type { NvComment } from "@/types/api/comment.types";
import { sendMessage } from "@/utils/browser";
import { loadSettings } from "@/utils/storage";
import { catchAsync, replace } from "@/utils/util";

export async function mountToDropdown() {
  appendButton(
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
  );

  await appendInformation();
}

function appendButton(
  ...data: { text: string; callback: () => Promise<void> }[]
) {
  const parent = document.querySelector(".z_dropdown > div > div:last-of-type");
  if (parent === null) return;

  const sample = parent.querySelector(":scope > button");
  if (sample === null) return;

  for (const { text, callback } of data) {
    const button = document.createElement("button");

    button.addEventListener("click", catchAsync(callback));
    button.textContent = replace(text, [browser.runtime.getManifest().name]);
    for (const attribute of sample.attributes) {
      button.setAttribute(attribute.name, attribute.value);
    }

    parent.append(button);
  }
}

async function appendInformation() {
  const comment = (await sendMessage({
    type: "get-dropdown-comment",
  })) as NvComment | undefined;
  if (comment === undefined) return;

  const settings = await loadSettings();
  const texts = [
    ...(settings.showUserIdInDropdown ? [`ユーザーID：${comment.userId}`] : []),
    ...(settings.showScoreInDropdown ? [`スコア：${comment.score}`] : []),
  ];
  if (texts.length === 0) return;

  const sample = document.querySelector(".z_dropdown > div > div:nth-child(2)");
  const parent = document.querySelector(".z_dropdown > div > div:last-of-type");
  if (sample === null || parent === null) return;

  for (const text of texts) {
    const div = document.createElement("div");
    div.textContent = `${text} (${browser.runtime.getManifest().name})`;
    for (const attribute of sample.attributes) {
      div.setAttribute(attribute.name, attribute.value);
    }

    parent.before(div);
  }
}
