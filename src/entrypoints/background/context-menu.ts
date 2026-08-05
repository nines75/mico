import { getActiveTab, notify } from "@/utils/browser";
import { getLog } from "@/utils/db";
import { getLogIdViaMessage } from "@/utils/messaging";
import { loadSettings } from "@/utils/storage";
import { addAutoRule } from "@/utils/storage-write";
import { isString } from "@/utils/util";

// この関数はaddAutoRuleのラッパーなので、
// 本来はno-restricted-pathsを適用させるためにstorage-write.tsに置くべきだが、
// より強いパスの制限が必要となるDBへアクセスしているため、
// storage-write.tsを例外に入れるのではなくここで定義する
export async function addRuleFromUrl(url: string | undefined, memo?: string) {
  const settings = await loadSettings();

  const tab = await getActiveTab();
  const logId = await getLogIdViaMessage(tab?.id);
  const log = logId === undefined ? undefined : await getLog(logId);

  const videoId = url?.match(
    /^https:\/\/www\.nicovideo\.jp\/(?:watch|shorts)\/([^?]+)/,
  )?.[1];
  if (videoId !== undefined) {
    const videoTitle = log?.video?.allVideos.find(
      (video) => video.id === videoId,
    )?.title;

    await addAutoRule([
      {
        pattern: videoId,
        source: "contextMenu",
        target: { videoId: true },
        ...(videoTitle !== undefined && {
          context: `video-title: ${videoTitle}`,
        }),
        ...(memo !== undefined && memo !== "" && { memo }),
      },
    ]);

    if (settings.notifyOnManualNg) {
      const context = videoTitle === undefined ? "" : ` (${videoTitle})`;

      await notify(`以下の動画IDをNG登録しました\n\n${videoId}${context}`);
    }

    return;
  }

  const ownerId = url?.match(
    /^https:\/\/(?:www\.nicovideo\.jp\/user|ch\.nicovideo\.jp\/channel)\/([^?]+)/,
  )?.[1];
  if (ownerId !== undefined) {
    const ownerName = log?.video?.allVideos.find(
      (video) => video.owner.id === ownerId,
    )?.owner.name;

    await addAutoRule([
      {
        pattern: ownerId,
        source: "contextMenu",
        target: { videoOwnerId: true },
        ...(isString(ownerName) && { context: `owner-name: ${ownerName}` }),
        ...(memo !== undefined && memo !== "" && { memo }),
      },
    ]);

    if (settings.notifyOnManualNg) {
      const context = isString(ownerName) ? ` (${ownerName})` : "";

      await notify(`以下のユーザーIDをNG登録しました\n\n${ownerId}${context}`);
    }

    return;
  }

  await notify("NG登録に失敗しました");
}
