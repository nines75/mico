import Editor from "./Editor.js";
import { useShallow } from "zustand/shallow";
import { useStorageStore } from "@/utils/store.js";
import clsx from "clsx";

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
                {videoFilterAreaConfig.map((filter) => (
                    <button
                        key={filter.id}
                        className={clsx(
                            "common-button",
                            "filter-button",
                            id === filter.id && "selected-filter-button",
                        )}
                        onClick={() => {
                            save({ selectedVideoFilter: filter.id });
                        }}
                    >
                        <span>{filter.name}</span>
                    </button>
                ))}
            </div>
            <Editor
                key={id}
                {...{ id }}
                value={text}
                onChange={(str) => {
                    save({ [id]: str });
                }}
            />
        </div>
    );
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

export const videoFilterAreaConfig = [
    {
        id: "ngId",
        name: "NGユーザーID/動画ID",
    },
    {
        id: "ngUserName",
        name: "NGユーザー名",
    },
    {
        id: "ngTitle",
        name: "NGタイトル",
    },
] satisfies VideoFilterAreaProps[];
