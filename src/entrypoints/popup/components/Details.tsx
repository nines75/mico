import type { Settings } from "@/types/storage/settings.types.js";
import { useStorageStore } from "@/utils/store.js";
import type { ConditionalPick } from "type-fest";
import { useShallow } from "zustand/shallow";

interface DetailsProps {
    id: keyof ConditionalPick<Settings, boolean>;
    summary: string;
    children: React.ReactNode;
}

export default function Details({ id, summary, children }: DetailsProps) {
    const [isOpen, save] = useStorageStore(
        useShallow((state) => [state.settings[id], state.saveSettings]),
    );

    return (
        <details
            open={useStorageStore.getState().settings[id]}
            onToggle={(e) => {
                const target = e.target as HTMLDetailsElement;
                const isOpenCurrent = target.open;

                if (isOpenCurrent === isOpen) return; // onToggleは初期値がtrueの場合も発火するのでここで弾く

                save({ [id]: isOpenCurrent });
            }}
        >
            <summary>{summary}</summary>
            {children}
        </details>
    );
}
