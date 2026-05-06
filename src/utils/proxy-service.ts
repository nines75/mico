// -------------------------------------------------------------------------------------------
// proxyServiceをproxy.tsで定義すると余計なコードがバンドルされる可能性がある
// そのためこのファイルで定義し、proxy.tsでは型のみをインポートする
// -------------------------------------------------------------------------------------------

import { getDropdownComment } from "@/entrypoints/background/scripting";
import { getLog, setTab } from "./db";
import { getActiveTab, notify, setBadgeState } from "./browser";
import {
  addAutoRule,
  reset,
  removeAutoRule,
  setSettings,
} from "./storage-write";

export const proxyService = {
  notify,
  setBadgeState,
  getActiveTab,
  getDropdownComment,
  // storage
  reset,
  setSettings,
  addAutoRule,
  removeAutoRule,
  // db
  getLog,
  setTab,
};
