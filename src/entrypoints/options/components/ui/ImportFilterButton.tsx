import type { Settings } from "@/types/storage/settings.types";
import { useStorageStore } from "@/utils/store";
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
                onChange={(e) => {
                    importFilter(e, save, id);
                }}
            />
        </>
    );
}

function importFilter(
    event: ChangeEvent<HTMLInputElement>,
    saveSettings: (settings: Partial<Settings>) => void,
    key: keyof Settings,
) {
    const reader = new FileReader();
    reader.addEventListener("load", (e) => {
        const res = e.target?.result;

        if (typeof res === "string") {
            saveSettings({ [key]: res });
        }
    });

    const file = event.target.files?.[0];
    if (file === undefined) return;

    reader.readAsText(file);
}
