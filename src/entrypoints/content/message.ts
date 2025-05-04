import { selectors } from "@/utils/config.js";
import { extractVideoId } from "@/utils/util.js";

export interface Message {
    type: string;
    data: unknown;
}

export function contentMessageHandler(
    message: Message,
    sender: browser.runtime.MessageSender
) {
    if (sender.id !== browser.runtime.id) return;

    if (message.type === "auto-reload") autoReload(message.data as number);
    if (message.type === "focus-player") focusPlayer();
    if (message.type === "set-playback-time")
        setPlaybackTime(message.data as number);
}

function autoReload(tabId: number) {
    const id = setInterval(async () => {
        try {
            const video = document.querySelector("video");
            if (video !== null) {
                clearInterval(id);

                const videoId = extractVideoId(location.href);
                if (videoId === undefined) return;

                await browser.runtime.sendMessage({
                    type: "save-playback-time",
                    data: {
                        tabId,
                        time: Math.floor(video.currentTime),
                    },
                });

                location.reload();
            }
        } catch (e) {
            console.error(e);
        }
    }, 10);
}

function focusPlayer() {
    const player = document.querySelector(selectors.player);

    if (player instanceof HTMLDivElement) player.focus();
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
