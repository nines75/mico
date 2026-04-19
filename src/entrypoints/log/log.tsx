import { useEffect, useState } from "react";
import { useStorageStore } from "@/utils/store";
import type { LogTab } from "@/types/storage/log.types";
import clsx from "clsx";
import { CommentViewer } from "./components/CommentViewer";
import { VideoViewer } from "./components/VideoViewer";

export function Init() {
    const isLoading = useStorageStore((state) => state.isLoading);

    useEffect(() => {
        useStorageStore.getState().loadLog();
    }, []);

    if (isLoading) return null;

    return <Page />;
}

function Page() {
    const [tab, setTab] = useState<LogTab>("commentFilter");

    return (
        <>
            <div className="tab">
                {config.map(({ id, name }) => (
                    <button
                        key={id}
                        className={clsx(
                            "tab-button",
                            id === tab && "selected-tab-button",
                        )}
                        onClick={() => {
                            setTab(id);
                        }}
                    >
                        {name}
                    </button>
                ))}
            </div>
            {(() => {
                switch (tab) {
                    case "commentFilter": {
                        return <CommentViewer />;
                    }
                    case "videoFilter": {
                        return <VideoViewer />;
                    }
                }
            })()}
        </>
    );
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

const config = [
    {
        id: "commentFilter",
        name: "コメントフィルター",
    },
    {
        id: "videoFilter",
        name: "動画フィルター",
    },
] as const;
