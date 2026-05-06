import { proxy } from "@/utils/proxy";
import { loadSettings } from "@/utils/storage";
import { catchAsync, escapeNewline } from "@/utils/util";
import { getLogId } from "@/utils/log";
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
      text: "この動画だけユーザーをNG登録",
      onClick: onClickNgUser(true),
    },
    {
      text: "ユーザーが投稿したコメント",
      onClick: async () => {
        const comments = await getComments();
        if (comments === undefined) {
          await proxy.notify("コメントの取得に失敗しました");
          return;
        }

        alert(comments);
      },
    },
  ];

  const parent = document.querySelector(".z_dropdown > div > div:last-of-type");
  if (parent === null) return;

  const sample = parent.querySelector(":scope > button");
  if (sample === null) return;

  for (const { text, onClick } of data) {
    const button = document.createElement("button");

    button.addEventListener("click", catchAsync(onClick));
    button.textContent = `${text}(${browser.runtime.getManifest().name})`;
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

async function getComments() {
  const logId = getLogId();
  if (logId === undefined) return;

  const log = await proxy.getLog(logId);
  if (log === undefined) return;

  const dropdownComment = await proxy.getDropdownComment();
  const userId = dropdownComment?.userId;
  if (userId === undefined) return;

  return log.comment?.allComments
    .filter((comment) => comment.userId === userId)
    .toSorted((a, b) => a.body.localeCompare(b.body))
    .toSorted((a, b) => a.score - b.score)
    .map(
      (comment) =>
        `${comment.score < 0 ? `[🚫:${comment.score}]` : ""}${escapeNewline(comment.body)}`,
    )
    .join("\n");
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
    div.textContent = `${text} (${browser.runtime.getManifest().name})`;
    for (const attribute of sample.attributes) {
      div.setAttribute(attribute.name, attribute.value);
    }

    parent.before(div);
  }
}
