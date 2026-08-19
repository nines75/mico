import type { Log } from "@/types/storage/log.types";
import { notify } from "@/utils/browser";
import { getLog } from "@/utils/db";
import { getLogIdViaMessage } from "@/utils/messaging";
import { loadSettings } from "@/utils/storage";
import { addAutoRule } from "@/utils/storage-write";
import { isString } from "@/utils/util";

// この関数はaddAutoRuleのラッパーなので、
// 本来はno-restricted-pathsを適用させるためにstorage-write.tsに置くべきだが、
// より強いパスの制限が必要となるDBへアクセスしているため、
// storage-write.tsを例外に入れるのではなくここで定義する
export async function addRuleFromUrl(url: string | undefined) {
  const settings = await loadSettings();

  const logId = await getLogIdViaMessage();
  const log = logId === undefined ? undefined : await getLog(logId);

  for (const getRule of [getVideoIdRule, getOwnerIdRule]) {
    const result = getRule(url, log);
    if (result === undefined) continue;

    await addAutoRule([{ source: "contextMenu", ...result.rule }]);

    if (settings.notifyOnManualNg) {
      await notify(result.message);
    }

    return;
  }

  await notify("NG登録に失敗しました");
}

function getVideoIdRule(url: string | undefined, log: Log | undefined) {
  const videoId = url?.match(
    /^https:\/\/www\.nicovideo\.jp\/(?:watch|shorts)\/([^?]+)/,
  )?.[1];
  if (videoId === undefined) return;

  const videoTitle = log?.video?.allVideos.find(
    (video) => video.id === videoId,
  )?.title;

  return {
    rule: {
      pattern: videoId,
      target: { videoId: true },
      ...(videoTitle !== undefined && {
        context: `video-title: ${videoTitle}`,
      }),
    },
    message: `以下の動画IDをNG登録しました\n\n${videoId}${videoTitle === undefined ? "" : ` (${videoTitle})`}`,
  };
}

function getOwnerIdRule(url: string | undefined, log: Log | undefined) {
  const ownerId = url?.match(
    /^https:\/\/(?:www\.nicovideo\.jp\/user|ch\.nicovideo\.jp\/channel)\/([^?]+)/,
  )?.[1];
  if (ownerId === undefined) return;

  const ownerName = log?.video?.allVideos.find(
    (video) => video.owner.id === ownerId,
  )?.owner.name;

  return {
    rule: {
      pattern: ownerId,
      target: { videoOwnerId: true },
      ...(isString(ownerName) && { context: `owner-name: ${ownerName}` }),
    },
    message: `以下のユーザーIDをNG登録しました\n\n${ownerId}${isString(ownerName) ? ` (${ownerName})` : ""}`,
  };
}
