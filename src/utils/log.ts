import { getActiveTab, notify } from "./browser";
import { getLogIdViaMessage } from "./messaging";

export function createLogId() {
  return crypto.randomUUID();
}

export function getLogId() {
  const id = `${browser.runtime.getManifest().name}-log-id`;
  const element = document.querySelector(`#${id}`);

  return element?.textContent;
}

export async function openLog(params = "") {
  const tab = await getActiveTab();
  const logId = await getLogIdViaMessage(tab?.id);
  if (logId === undefined) {
    await notify("ログが存在しません");
    return;
  }

  await browser.windows.create({
    url: [`log.html?id=${logId}${params}`],
    type: "popup",
    titlePreface: "ログ",
    height: 800,
    width: 1300,
  });
}
