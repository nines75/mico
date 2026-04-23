import type { LogId } from "@/types/storage/log.types";
import { sendMessageToBackground } from "@/utils/browser";

type ExtractData<T extends Extract<ContentMessage, { data: unknown }>["type"]> =
    Extract<ContentMessage, { type: T }>["data"];

export type ContentMessage =
    | {
          type: "reload";
      }
    | {
          type: "set-playback-time";
          data: number;
      }
    | {
          type: "mount-to-dropdown";
          data: string[];
      }
    | {
          type: "mount-log-id";
          data: LogId;
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
            case "mount-to-dropdown": {
                mountToDropdown(message.data);
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

    await sendMessageToBackground({
        type: "set-tab",
        data: {
            playbackTime: Math.floor(video.currentTime),
        },
    });

    location.reload();
}

function setPlaybackTime(time: ExtractData<"set-playback-time">) {
    const id = setInterval(() => {
        const video = document.querySelector("video");
        if (video !== null) {
            clearInterval(id);

            video.currentTime = time;
        }
    }, 10);
}

function mountToDropdown(texts: ExtractData<"mount-to-dropdown">) {
    const parent = document.querySelector(".z_dropdown > div");
    if (parent === null) return;

    const sample = parent.querySelector(":scope > div:nth-child(2)");
    const buttons = parent.querySelector(":scope > div:last-of-type");
    if (sample === null || buttons === null) return;

    for (const text of texts) {
        const div = document.createElement("div");
        div.textContent = `${text} (${browser.runtime.getManifest().name})`;
        for (const attribute of sample.attributes) {
            div.setAttribute(attribute.name, attribute.value);
        }

        buttons.before(div);
    }
}

function mountLogId(logId: ExtractData<"mount-log-id">) {
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
