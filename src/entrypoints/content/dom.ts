import { proxy } from "@/utils/proxy";

export async function reload() {
  const video = document.querySelector("video");
  if (video === null) return;

  const tab = await proxy.getActiveTab();
  const tabId = tab?.id;
  if (tabId === undefined) return;

  await proxy.setTab({ playbackTime: Math.floor(video.currentTime) }, tabId);

  location.reload();
}

export function getLogId() {
  const id = `${browser.runtime.getManifest().name}-log-id`;
  const element = document.querySelector(`#${id}`);

  return element?.textContent;
}
