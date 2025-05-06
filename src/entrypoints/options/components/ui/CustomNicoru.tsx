import { useShallow } from "zustand/shallow";
import NicoruColorPicker from "./NicoruColorPicker.js";
import { useStorageStore } from "@/utils/store.js";

interface CustomNicoruProps {
    id: number;
}

export default function CustomNicoru({ id }: CustomNicoruProps) {
    const [isGradate, nicoruCounts, save] = useStorageStore(
        useShallow((state) => [
            state.settings.nicoruColors[id]?.isGradate ?? false,
            state.settings.nicoruCounts,
            state.saveSettings,
        ]),
    );

    const removeNicoruCount = (target: number) => {
        save({
            nicoruCounts: nicoruCounts.filter((count) => count !== target),
        });
    };

    return (
        <div className="color-picker">
            <button onClick={() => removeNicoruCount(id)}>✕</button>
            <span>{id}+</span>
            <label>
                <input
                    type="checkbox"
                    checked={isGradate}
                    onChange={(e) =>
                        save({
                            nicoruColors: {
                                [id]: {
                                    isGradate: e.target.checked,
                                },
                            },
                        })
                    }
                />
                グラデーション
            </label>
            <NicoruColorPicker type="primary" {...{ id }} />
            <NicoruColorPicker type="secondary" {...{ id }} />
        </div>
    );
}
