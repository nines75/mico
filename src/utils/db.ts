// -------------------------------------------------------------------------------------------
// このファイルの関数はbackground以外からは呼び出さない
// https://github.com/nines75/mico/issues/40
// -------------------------------------------------------------------------------------------

import type { LogData } from "@/types/storage/log.types";
import Dexie, { type EntityTable } from "dexie";
import type { TabData } from "@/types/storage/tab.types";
import { customMerge } from "./util";

interface LogDb {
    id: string;
    tabId: number;
    log: LogData;
}

interface TabDb {
    tabId: number;
    data: TabData;
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

export async function getLogData(id: string) {
    const res = await db.log.get(id);

    return res?.log;
}

export async function getTabData(tabId: number) {
    const res = await db.tab.get(tabId);

    return res?.data;
}

export async function setLog(
    value: Partial<LogData>,
    id: string,
    tabId: number,
) {
    await db.transaction("rw", db.log, async () => {
        const logDb = await db.log.get(id);
        const newLog = customMerge(logDb?.log, value) as LogData;

        await db.log.put({ id: id, tabId, log: newLog });
    });
}

export async function setTabData(value: Partial<TabData>, tabId: number) {
    await db.transaction("rw", db.tab, async () => {
        const tabDb = await db.tab.get(tabId);
        const newData = customMerge(tabDb?.data, value) as TabData;

        await db.tab.put({ tabId, data: newData });
    });
}

export async function cleanupDb() {
    const tabs = await browser.tabs.query({});
    const aliveTabIds = tabs
        .map((tab) => tab.id)
        .filter((id) => id !== undefined);

    const deleteKeys = async (...tables: Dexie.Table[]) => {
        for (const table of tables) {
            await db.transaction("rw", table, async () => {
                const keys = await table
                    .where("tabId")
                    .noneOf(aliveTabIds)
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
