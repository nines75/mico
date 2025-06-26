import Editor from "./Editor.js";
import { useShallow } from "zustand/shallow";
import { useStorageStore } from "@/utils/store.js";
import { videoFilterSettings } from "@/utils/config.js";

export type VideoFilterId = "ngId" | "ngTitle" | "ngUserName";

export interface VideoFilterAreaProps {
    id: VideoFilterId;
    name: string;
}

export default function VideoFilterArea() {
    const id = useStorageStore((state) => state.settings.selectedVideoFilter);
    const [text, save] = useStorageStore(
        useShallow((state) => [state.settings[id], state.saveSettings]),
    );

    return (
        <div className="setting">
            <div>
                {videoFilterSettings.filter.map((filter) => (
                    <button
                        key={filter.id}
                        className={`filter-button${id === filter.id ? " selected-filter-button" : ""}`}
                        onClick={() => save({ selectedVideoFilter: filter.id })}
                    >
                        <span>{filter.name}</span>
                    </button>
                ))}
            </div>
            <Editor
                key={id}
                {...{ id }}
                value={text}
                onChange={(str) => save({ [id]: str })}
            />
        </div>
    );
}
