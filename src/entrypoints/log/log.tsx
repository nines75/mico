import { useEffect, useState } from "react";
import { useLogStore } from "@/utils/store";
import type { LogTab } from "@/types/storage/log.types";
import clsx from "clsx";
import { CommentViewer } from "./components/CommentViewer";
import { VideoViewer } from "./components/VideoViewer";
import { PartialCommentViewer } from "./components/PartialCommentViewer";
import { useShallow } from "zustand/shallow";

export function Init() {
  const [isLoading, userId, load] = useLogStore(
    useShallow((state) => [state.isLoading, state.userId, state.load]),
  );

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) return null;

  if (userId !== undefined) {
    return <PartialCommentViewer />;
  }

  return <Page />;
}

function Page() {
  const [comment, video] = useLogStore(
    useShallow((state) => [state.log?.comment, state.log?.video]),
  );
  const [tab, setTab] = useState<LogTab>(
    comment === undefined && video !== undefined
      ? "videoFilter"
      : "commentFilter",
  );

  return (
    <>
      <div className="tab">
        {config.map(({ id, name }) => (
          <button
            key={id}
            className={clsx("tab-button", id === tab && "selected")}
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
