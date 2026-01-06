import type { Settings } from "@/types/storage/settings.types";
import { useStorageStore } from "@/utils/store";
import type { ConditionalPick } from "type-fest";
import { useShallow } from "zustand/shallow";

interface CheckboxInputProps {
    id: keyof ConditionalPick<Settings, number>;
    label: string;
    min?: number;
    max?: number;
}

export default function CheckboxInput({
    id,
    label,
    min,
    max,
}: CheckboxInputProps) {
    const [input, save] = useStorageStore(
        useShallow((state) => [state.settings[id], state.saveSettings]),
    );

    return (
        <label className="checkbox-input">
            <input
                {...{ min, max }}
                type="number"
                size={5}
                value={input}
                onChange={(e) => {
                    save({ [id]: Number(e.target.value) });
                }}
            />
            {label}
        </label>
    );
}
