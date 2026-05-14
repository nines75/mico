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
  setSettingsMeta,
  migrateSettings,
  cleanUp,
} from "./storage-write";
import { openLog } from "./log";

export const proxyService = {
  notify,
  setBadgeState,
  getActiveTab,
  getDropdownComment,
  openLog,
  // storage
  reset,
  cleanUp,
  setSettings,
  setSettingsMeta,
  migrateSettings,
  addAutoRule,
  removeAutoRule,
  // db
  getLog,
  setTab,
};
