import { messages } from "@/utils/config.js";
import { getLogData, loadSettings } from "@/utils/storage.js";
import { sendNotification } from "@/utils/util.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import { filterVideo } from "./video-filter/filter-video.js";
import { saveLog } from "./video-filter/save-log.js";
import { Settings } from "@/types/storage/settings.types.js";
import {
    setLog,
    setSettings,
    removeAllData,
    addNgUserId,
    removeNgUserId,
    addNgId,
    removeNgId,
} from "@/utils/storage-write.js";
import { sendMessageToContent } from "../content/message.js";

type BackgroundMessage =
    | {
          type: "save-playback-time";
          data: {
              tabId: number;
              time: number;
          };
      }
    | {
          type: "save-ng-user-id";
          data: {
              commentNo: number;
              specific: boolean;
          };
      }
    | {
          type: "get-user-id";
          data: number;
      }
    | {
          type: "filter-old-search";
          data: NiconicoVideo[];
      }
    | {
          type: "set-settings";
          data: Partial<Settings>;
      }
    | {
          type: "remove-all-data";
          data?: unknown;
      }
    | {
          type: "add-ng-user-id";
          data: Set<string>;
      }
    | {
          type: "remove-ng-user-id";
          data: {
              userIds: Set<string>;
              isRemoveSpecific?: boolean;
          };
      }
    | {
          type: "add-ng-id";
          data: string;
      }
    | {
          type: "remove-ng-id";
          data: string;
      };

export async function sendMessageToBackground(message: BackgroundMessage) {
    await browser.runtime.sendMessage(message);
}

export async function backgroundMessageHandler(
    message: BackgroundMessage,
    sender: browser.runtime.MessageSender,
) {
    // エラーの発生箇所を出力するためにメッセージ受信側でエラーを出力
    try {
        if (sender.id !== browser.runtime.id) return;

        switch (message.type) {
            case "save-playback-time": {
                await setLog(
                    { playbackTime: message.data.time },
                    message.data.tabId,
                );
                break;
            }
            case "save-ng-user-id": {
                await saveNgUserId(message, sender);
                break;
            }
            case "get-user-id": {
                await getUserId(message, sender);
                break;
            }
            case "filter-old-search": {
                await filterOldSearch(message, sender);
                break;
            }
            case "set-settings": {
                await setSettings(message.data);
                break;
            }
            case "remove-all-data": {
                await removeAllData();
                break;
            }
            case "add-ng-user-id": {
                await addNgUserId(message.data);
                break;
            }
            case "remove-ng-user-id": {
                await removeNgUserId(
                    message.data.userIds,
                    message.data.isRemoveSpecific,
                );
                break;
            }
            case "add-ng-id": {
                await addNgId(message.data);
                break;
            }
            case "remove-ng-id": {
                await removeNgId(message.data);
                break;
            }
        }
    } catch (e) {
        console.error(e);
    }
}

async function getUserId(
    message: BackgroundMessage,
    sender: browser.runtime.MessageSender,
) {
    const commentNo = message.data as number;

    const tabId = sender.tab?.id;
    if (tabId === undefined) return;

    const logData = await getLogData(tabId);
    const userId =
        logData?.commentFilterLog?.filtering.noToUserId.get(commentNo);
    if (userId === undefined) return;

    await sendMessageToContent(tabId, {
        type: "mount-user-id",
        data: userId,
    });
}

async function saveNgUserId(
    message: BackgroundMessage,
    sender: browser.runtime.MessageSender,
) {
    const data = message.data as {
        commentNo: number;
        specific: boolean;
    };

    const tabId = sender.tab?.id;
    if (tabId === undefined) return;

    const log = await getLogData(tabId);
    const videoId = log?.videoId ?? undefined;
    const userId = log?.commentFilterLog?.filtering.noToUserId.get(
        data.commentNo,
    );
    if (log === undefined || videoId === undefined || userId === undefined) {
        await sendNotification(messages.ngUserId.additionFailed);
        return;
    }

    await addNgUserId(
        new Set([data.specific ? `${videoId}@${userId}` : userId]),
    );

    const settings = await loadSettings();
    const tasks: Promise<void>[] = [];

    if (settings.isAutoReload) {
        tasks.push(
            sendMessageToContent(tabId, {
                type: "reload",
                data: tabId,
            }),
        );
    }

    if (settings.isNotifyAddNgUserId) {
        tasks.push(sendNotification(messages.ngUserId.additionSuccess));
    }

    await Promise.all(tasks);
}

async function filterOldSearch(
    message: BackgroundMessage,
    sender: browser.runtime.MessageSender,
) {
    const data = message.data as NiconicoVideo[];
    const settings = await loadSettings();

    const tabId = sender.tab?.id;
    if (tabId === undefined) return;

    const filteredData = filterVideo(data, settings);
    if (filteredData === undefined) return;

    await Promise.all([
        saveLog(filteredData, tabId, true),
        sendMessageToContent(tabId, {
            type: "remove-old-search",
            data: filteredData.filteredIds,
        }),
    ]);
}
