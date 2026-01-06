import { useStorageStore } from "@/utils/store";
import { useShallow } from "zustand/shallow";

interface NicoruColorPickerProps {
    id: number;
    type: "primary" | "secondary";
}

export default function NicoruColorPicker({
    id,
    type,
}: NicoruColorPickerProps) {
    const [color, save] = useStorageStore(
        useShallow((state) => [
            state.settings.nicoruColors[id]?.[type] ?? "",
            state.saveSettings,
        ]),
    );

    return (
        <input
            type="color"
            value={color}
            onChange={(e) => {
                save({
                    nicoruColors: {
                        [id]: {
                            [type]: e.target.value,
                        },
                    },
                });
            }}
        />
    );
}
