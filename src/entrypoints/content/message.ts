import type { LogId } from "@/types/storage/log.types";
import { sendMessage } from "@/utils/browser";

export type ContentMessage =
  | {
      type: "reload";
    }
  | {
      type: "set-playback-time";
      data: Parameters<typeof setPlaybackTime>[0];
    }
  | {
      type: "mount-log-id";
      data: Parameters<typeof mountLogId>[0];
    }
  | {
      type: "get-log-id";
    };

export async function contentMessageHandler(
  message: ContentMessage,
  sender: browser.runtime.MessageSender,
) {
  // エラーの発生箇所を出力するためにメッセージ受信側でエラーを出力
  try {
    if (sender.id !== browser.runtime.id) return;

    switch (message.type) {
      case "reload": {
        await reload();
        break;
      }
      case "set-playback-time": {
        setPlaybackTime(message.data);
        break;
      }
      case "mount-log-id": {
        mountLogId(message.data);
        break;
      }
      case "get-log-id": {
        return getLogId();
      }
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function reload() {
  const video = document.querySelector("video");
  if (video === null) return;

  await sendMessage({
    type: "set-tab",
    data: {
      playbackTime: Math.floor(video.currentTime),
    },
  });

  location.reload();
}

function setPlaybackTime(time: number) {
  const id = setInterval(() => {
    const video = document.querySelector("video");
    if (video !== null) {
      clearInterval(id);

      video.currentTime = time;
    }
  }, 10);
}

function mountLogId(logId: LogId) {
  const id = `${browser.runtime.getManifest().name}-log-id`;
  const current = document.querySelector(`#${id}`);

  if (current === null) {
    const div = document.createElement("div");
    div.style.display = "none";
    div.id = id;
    div.textContent = logId;

    document.body.append(div);
  } else {
    current.textContent = logId;
  }
}

function getLogId() {
  const id = `${browser.runtime.getManifest().name}-log-id`;
  const element = document.querySelector(`#${id}`);

  return element?.textContent;
}
