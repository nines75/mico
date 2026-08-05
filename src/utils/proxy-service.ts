// -------------------------------------------------------------------------------------------
// proxyServiceをproxy.tsで定義すると余計なコードがバンドルされる可能性がある
// そのためこのファイルで定義し、proxy.tsでは型のみをインポートする
// -------------------------------------------------------------------------------------------

import { getDropdownComment } from "@/entrypoints/background/scripting";
import { getLog, setTab } from "./db";
import { getActiveTab, notify, setBadgeState } from "./browser";
import { addAutoRule } from "./storage-write";
import { openLog } from "./log";

export const proxyService = {
  notify,
  setBadgeState,
  getActiveTab,
  getDropdownComment,
  openLog,
  // storage
  addAutoRule,
  // db
  getLog,
  setTab,
};
