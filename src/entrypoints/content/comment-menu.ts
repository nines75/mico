import { proxy } from "@/utils/proxy";
import { loadSettings } from "@/utils/storage";
import { catchAsync } from "@/utils/util";
import { getLogId, reload } from "./dom";

export async function mountToCommentMenu() {
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
        const comment = await proxy.getMenuComment();
        const userId = comment?.userId;
        if (userId === undefined) {
          await proxy.notify("ユーザー情報の取得に失敗しました");
          return;
        }

        const logId = getLogId();
        await proxy.openLog(logId, `&userId=${userId}`);
      },
    },
  ];

  const parent = document.querySelector(".z_dropdown > div > div:last-of-type");
  if (parent === null) return;

  const sample = parent.querySelector(":scope > button");
  if (sample === null) return;

  for (const { text, onClick } of data) {
    const span = document.createElement("span");
    span.textContent = text;
    span.style.maxWidth = "130px";
    span.style.whiteSpace = "nowrap"; // テキストを折り返さない
    span.style.textOverflow = "ellipsis"; // テキストがはみ出た場合に省略記号を表示する
    span.style.overflow = "hidden"; // ellipsisとセットで使う

    const img = document.createElement("img");
    img.src = browser.runtime.getURL("/icons/128.png");
    img.style.width = "16px"; // サイズを明示的に指定しないと省略される幅に上限ができてしまう
    img.style.height = "16px";

    const button = document.createElement("button");
    button.addEventListener("click", catchAsync(onClick));
    button.title = `${text} (${browser.runtime.getManifest().name})`;
    button.style.display = "flex";
    button.style.gap = "4px";

    button.append(img, span);

    for (const attribute of sample.attributes) {
      button.setAttribute(attribute.name, attribute.value);
    }

    parent.append(button);
  }
}

function onClickNgUser(videoOnly = false) {
  return async () => {
    const settings = await loadSettings();

    const logId = getLogId();
    const comment = await proxy.getMenuComment();
    if (logId === undefined || comment?.$videoId === undefined) {
      await proxy.notify("NG登録に失敗しました");
      return;
    }

    const log = await proxy.getLog(logId);
    const count =
      log?.comment?.allComments.filter(
        (target) =>
          target.userId === comment.userId && target.body === comment.body,
      ).length ?? 0;

    await proxy.addAutoRule([
      {
        pattern: comment.userId,
        videoId: comment.$videoId,
        context: `comment-body${count > 1 ? `(${count}回)` : ""}: ${comment.body}`,
        source: "commentMenu",
        target: { commentUserId: true },
        ...(videoOnly && { enable: { videoIds: [[comment.$videoId]] } }),
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
  const comment = await proxy.getMenuComment();
  if (comment === undefined) return;

  const settings = await loadSettings();
  const texts = [
    ...(settings.showUserIdInCommentMenu
      ? [`ユーザーID：${comment.userId}`]
      : []),
    ...(settings.showScoreInCommentMenu ? [`スコア：${comment.score}`] : []),
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
