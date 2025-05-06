import { ConditionalPick } from "type-fest";
import { useShallow } from "zustand/shallow";
import { useMemo, useRef } from "react";
import { Settings } from "@/types/storage/settings.types.js";
import { useStorageStore } from "@/utils/store.js";

interface DetailsProps {
    id: keyof ConditionalPick<Settings, boolean>;
    summary: string;
    children: React.ReactNode;
}

export default function Details({ id, summary, children }: DetailsProps) {
    const [isChecked, save] = useStorageStore(
        useShallow((state) => [state.settings[id], state.saveSettings]),
    );
    // インポート時などの再レンダリングの影響を受けないためにuseRefを使う
    // また、再レンダリング時に保存はされなくても取得自体は行われるため、useMemoを使って取得されないようにする
    const isOpen = useRef(
        useMemo(() => useStorageStore.getState().settings[id], [id]),
    );

    return (
        <details open={isOpen.current}>
            <summary>{summary}</summary>
            <div className="always-open">
                <label>
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                            save({
                                [id]: e.target.checked,
                            })
                        }
                    />
                    常に開く
                </label>
            </div>
            {children}
        </details>
    );
}
