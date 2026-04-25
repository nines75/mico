// -------------------------------------------------------------------------------------------
// このファイルの関数はbackground以外からは呼び出さない
// https://github.com/nines75/mico/issues/40
// -------------------------------------------------------------------------------------------

import type { Count, Log } from "@/types/storage/log.types";
import Dexie, { type EntityTable } from "dexie";
import type { Tab } from "@/types/storage/tab.types";
import { merge } from "./util";
import { objectEntries } from "ts-extras";

interface LogDb {
    id: string;
    tabId: number;
    log: Log;
}

interface TabDb {
    tabId: number;
    tab: Tab;
}

const db = new Dexie("main") as Dexie & {
    log: EntityTable<LogDb, "id">;
    tab: EntityTable<TabDb, "tabId">;
};

db.version(1).stores({
    // 主キーやwhereで使うキー以外はインデックスを作成しない
    log: "id, tabId",
    tab: "tabId",
});

export async function getLog(id: string) {
    const result = await db.log.get(id);

    return result?.log;
}

export async function getTab(tabId: number) {
    const result = await db.tab.get(tabId);

    return result?.tab;
}

export async function setLog(
    value: Partial<Log> | (() => Promise<Partial<Log>>),
    id: string,
    tabId: number,
) {
    await db.transaction("rw", db.log, async () => {
        const logDb = await db.log.get(id);
        const log = merge(
            logDb?.log,
            typeof value === "function" ? await value() : value,
        ) as Log;

        await db.log.put({ id, tabId, log });
    });
}

export async function setTab(value: Partial<Tab>, tabId: number) {
    await db.transaction("rw", db.tab, async () => {
        const tabDb = await db.tab.get(tabId);
        const tab = merge(tabDb?.tab, value) as Tab;

        await db.tab.put({ tabId, tab });
    });
}

export async function cleanUpDb() {
    const tabs = await browser.tabs.query({});
    const tabIds = tabs.map((tab) => tab.id).filter((id) => id !== undefined);

    const deleteKeys = async (...tables: Dexie.Table[]) => {
        for (const table of tables) {
            await db.transaction("rw", table, async () => {
                const keys = await table
                    .where("tabId")
                    .noneOf(tabIds)
                    .primaryKeys();
                if (keys.length > 0) await table.bulkDelete(keys);
            });
        }
    };

    await deleteKeys(db.log, db.tab);
}

export async function clearDb() {
    await Promise.all([db.log.clear(), db.tab.clear()]);
}

// 現在はコメントフィルターと動画フィルターでプロパティを共有していないが、将来的には一部共有する予定なのでマージ関数を用意しておく
export async function mergeCount(count: Count, logId: string): Promise<Count> {
    const log = await getLog(logId);

    return Object.fromEntries(
        objectEntries(count).map(([key, value]) => [
            key,
            value + (log?.count?.[key] ?? 0),
        ]),
    );
}
