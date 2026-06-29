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

  useEffect(() => {
    // 削除時に同じ参照を持つ関数を渡す必要があるため予め作成
    const keydownHandler = createKeydownHandler(setTab);
    globalThis.addEventListener("keydown", keydownHandler);

    return () => {
      globalThis.removeEventListener("keydown", keydownHandler);
    };
  }, []);

  return (
    <>
      <div className="tab">
        {config.map(({ id, name, key }) => (
          <button
            key={id}
            className={clsx("tab-button", id === tab && "selected")}
            onClick={() => {
              setTab(id);
            }}
          >
            {name}
            <kbd className="keybind">{key}</kbd>
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

function createKeydownHandler(setTab: (tab: LogTab) => void) {
  return (event: KeyboardEvent) => {
    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement)) return;

    // select要素にはデフォルトで選択肢を入力するとそれを選択するショートカットがある
    if (activeElement instanceof HTMLSelectElement) {
      if (event.key === "Escape") {
        activeElement.blur();
      }

      return;
    }

    // タブ
    if (event.key === "c") {
      setTab("commentFilter");
    }
    if (event.key === "v") {
      setTab("videoFilter");
    }

    if (event.key === "s") {
      // select要素のショートカットを無効化
      event.preventDefault();

      const select = document.querySelector("select");
      if (select instanceof HTMLElement) {
        select.focus();
      }
    }
  };
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

const config = [
  {
    id: "commentFilter",
    name: "コメントフィルター",
    key: "c",
  },
  {
    id: "videoFilter",
    name: "動画フィルター",
    key: "v",
  },
] as const;
