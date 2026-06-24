import { proxy } from "@/utils/proxy";
import { loadSettings } from "@/utils/storage";
import { catchAsync } from "@/utils/util";
import { reload } from "@/utils/dom";

export async function mountToDropdown() {
  appendButton();
  await appendInformation();
}

// -------------------------------------------------------------------------------------------
// button
// -------------------------------------------------------------------------------------------

function appendButton() {
  const data = [
    {
      text: "ユーザーをNG登録",
      onClick: onClickNgUser(),
    },
    {
      text: "この動画のみユーザーをNG登録",
      onClick: onClickNgUser(true),
    },
    {
      text: "ユーザーが投稿したコメントを表示",
      onClick: async () => {
        const comment = await proxy.getDropdownComment();
        const userId = comment?.userId;
        if (userId === undefined) {
          await proxy.notify("ユーザー情報の取得に失敗しました");
          return;
        }

        await proxy.openLog(`&userId=${userId}`);
      },
    },
  ];

  const parent = document.querySelector(".z_dropdown > div > div:last-of-type");
  if (parent === null) return;

  const sample = parent.querySelector(":scope > button");
  if (sample === null) return;

  for (const { text, onClick } of data) {
    const button = document.createElement("button");
    const textContent = `${text}(${browser.runtime.getManifest().name})`;

    button.addEventListener("click", catchAsync(onClick));
    button.textContent = textContent;
    button.title = textContent;

    button.style.maxWidth = "160px";
    button.style.whiteSpace = "nowrap"; // テキストを折り返さない
    button.style.textOverflow = "ellipsis"; // テキストがはみ出た場合に省略記号を表示する
    button.style.overflow = "hidden"; // ellipsisとセットで使う

    for (const attribute of sample.attributes) {
      button.setAttribute(attribute.name, attribute.value);
    }

    parent.append(button);
  }
}

function onClickNgUser(videoOnly = false) {
  return async () => {
    const settings = await loadSettings();
    const comment = await proxy.getDropdownComment();
    if (comment?.$videoId === undefined) {
      await proxy.notify("NG登録に失敗しました");
      return;
    }

    await proxy.addAutoRule([
      {
        pattern: comment.userId,
        context: `comment-body: ${comment.body}`,
        source: "dropdown",
        target: { commentUserId: true },
        ...(videoOnly && {
          include: { videoIds: [[comment.$videoId]] },
        }),
      },
    ]);

    if (settings.notifyOnManualNg && !settings.autoReload)
      await proxy.notify(
        `以下のユーザーIDをNG登録しました\n\n${comment.userId}`,
      );

    if (settings.autoReload) await reload();
  };
}

// -------------------------------------------------------------------------------------------
// information
// -------------------------------------------------------------------------------------------

async function appendInformation() {
  const comment = await proxy.getDropdownComment();
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
    div.textContent = text;

    for (const attribute of sample.attributes) {
      div.setAttribute(attribute.name, attribute.value);
    }

    parent.before(div);
  }
}
