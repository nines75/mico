import { useEffect } from "react";
import { useSettingsStore } from "@/utils/store";
import { useShallow } from "zustand/shallow";
import CommentFilter from "./components/tabs/CommentFilter";
import General from "./components/tabs/General";
import Support from "./components/tabs/Support";
import VideoFilter from "./components/tabs/VideoFilter";
import clsx from "clsx";
import type { Settings, SettingsTab } from "@/types/storage/settings.types";
import { defaultSettings } from "@/utils/config";
import { storageArea } from "@/utils/storage";
import Filter from "./components/tabs/Filter";

export function Init() {
  const [isLoading, load] = useSettingsStore(
    useShallow((state) => [state.isLoading, state.load]),
  );

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) return null;

  return <Page />;
}

function Page() {
  const [selectedTab, save] = useSettingsStore(
    useShallow((state) => [
      state.settings.selectedSettingsTab,
      state.saveSettings,
    ]),
  );

  useEffect(() => {
    browser.storage.onChanged.addListener(settingsChangeHandler);

    return () => {
      browser.storage.onChanged.removeListener(settingsChangeHandler);
    };
  }, []);

  return (
    <>
      <div className="tab-container">
        <div className="tab">
          {config.map((filter) => (
            <button
              key={filter.id}
              className={clsx(
                "tab-button",
                selectedTab === filter.id && "selected",
              )}
              onClick={() => {
                save({ selectedSettingsTab: filter.id });
              }}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>
      {(() => {
        switch (selectedTab) {
          case "general": {
            return <General />;
          }
          case "filter": {
            return <Filter />;
          }
          case "commentFilter": {
            return <CommentFilter />;
          }
          case "videoFilter": {
            return <VideoFilter />;
          }
          case "support": {
            return <Support />;
          }
        }
      })()}
    </>
  );
}

// 外部での変更を反映させるために必要
function settingsChangeHandler(
  changes: Record<string, browser.storage.StorageChange>,
  area: string,
) {
  if (area !== storageArea) return;

  for (const [key, value] of Object.entries(changes)) {
    if (key !== "settings") continue;

    const storeId = useSettingsStore.getState().storeId;
    const newSettings = {
      ...defaultSettings,
      ...(value.newValue as Partial<Settings>),
    };

    // 同一storeでの変更による発火を弾く
    if (storeId === newSettings.storeId) continue;

    useSettingsStore.setState({ settings: newSettings });
  }
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

const config = [
  {
    id: "general",
    name: "一般設定",
  },
  {
    id: "filter",
    name: "フィルター",
  },
  {
    id: "commentFilter",
    name: "コメントフィルター",
  },
  {
    id: "videoFilter",
    name: "動画フィルター",
  },
  {
    id: "support",
    name: "サポート",
  },
] satisfies {
  id: SettingsTab;
  name: string;
}[];
