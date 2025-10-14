import { LogData } from "@/types/storage/log.types.js";
import Dexie, { type EntityTable } from "dexie";
import { PartialDeep } from "type-fest";
import { customMerge } from "./storage.js";
import { TabData } from "@/types/storage/tab.types.js";

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
    value: PartialDeep<LogData>,
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

    const deleteKeys = async (target: Dexie.Table) => {
        await db.transaction("rw", target, async () => {
            const keys = await target
                .where("tabId")
                .noneOf(aliveTabIds)
                .primaryKeys();
            if (keys.length > 0) await target.bulkDelete(keys);
        });
    };

    await Promise.all([deleteKeys(db.log), deleteKeys(db.tab)]);
}

export async function clearDb() {
    await Promise.all([db.log.clear(), db.tab.clear()]);
}
