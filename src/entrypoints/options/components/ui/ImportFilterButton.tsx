import type { Settings } from "@/types/storage/settings.types";
import { useStorageStore } from "@/utils/store";
import { catchAsync } from "@/utils/util";
import { Import } from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef } from "react";

interface ImportFilterButtonProps {
    id: keyof Settings;
}

export default function ImportFilterButton({ id }: ImportFilterButtonProps) {
    const input = useRef<HTMLInputElement | null>(null);
    const save = useStorageStore((state) => state.saveSettings);

    return (
        <>
            <button
                className="common-button import-filter-button"
                onClick={() => {
                    if (input.current !== null) input.current.click();
                }}
            >
                <Import size={20} />
                インポート
            </button>
            <input
                type="file"
                accept=".txt"
                style={{ display: "none" }}
                ref={input}
                onChange={catchAsync(async (e) => {
                    await importFilter(e, save, id);
                })}
            />
        </>
    );
}

async function importFilter(
    event: ChangeEvent<HTMLInputElement>,
    saveSettings: (settings: Partial<Settings>) => void,
    key: keyof Settings,
) {
    const text = await event.target.files?.[0]?.text();
    if (text === undefined) return;

    saveSettings({ [key]: text });
}
