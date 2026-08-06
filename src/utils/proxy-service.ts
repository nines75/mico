// -------------------------------------------------------------------------------------------
// proxyServiceをproxy.tsで定義すると余計なコードがバンドルされる可能性がある
// そのためこのファイルで定義し、proxy.tsでは型のみをインポートする
// -------------------------------------------------------------------------------------------

import { getDropdownComment } from "@/entrypoints/background/scripting";
import { cleanUpDb, clearDb, getLog, setTab } from "./db";
import { getActiveTab, notify, openLog, setBadgeState } from "./browser";
import { addAutoRule } from "./storage-write";

// 使用箇所にジャンプするIDEの機能が使えなくなるため、プロパティ名の省略記法は使わない
export const proxyService = {
  notify: notify,
  setBadgeState: setBadgeState,
  getActiveTab: getActiveTab,
  getDropdownComment: getDropdownComment,
  openLog: openLog,
  // storage
  addAutoRule: addAutoRule,
  // db
  getLog: getLog,
  setTab: setTab,
  clearDb: clearDb,
  cleanUpDb: cleanUpDb,
};
