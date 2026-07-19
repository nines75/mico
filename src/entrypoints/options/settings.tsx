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
import AdvancedFeatures from "./components/tabs/AdvancedFeatures";
import { Announcement } from "./components/ui/Announcement";

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
  const [selectedTab, showAdvancedFeatures, save] = useSettingsStore(
    useShallow((state) => [
      state.settings.selectedSettingsTab,
      state.settings.showAdvancedFeatures,
      state.saveSettings,
    ]),
  );

  useEffect(() => {
    browser.storage.onChanged.addListener(settingsChangeHandler);

    // CodeMirrorのキーバインドより先行して処理するためにキャプチャフェーズで発火させる
    globalThis.addEventListener("keydown", keydownHandler, true);

    return () => {
      browser.storage.onChanged.removeListener(settingsChangeHandler);
      globalThis.removeEventListener("keydown", keydownHandler, true);
    };
  }, []);

  return (
    <>
      <title>{`${browser.runtime.getManifest().name} - 設定`}</title>
      <Announcement />
      <div className="tab-container">
        <div className="tab">
          {config.map((filter) => {
            if (filter.id === "advancedFeatures" && !showAdvancedFeatures)
              return null;

            return (
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
                <kbd className="keybind">{filter.key}</kbd>
              </button>
            );
          })}
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
          case "advancedFeatures": {
            return <AdvancedFeatures />;
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
    // https://github.com/nines75/mico/issues/71
    if (storeId === newSettings.storeId) continue;

    useSettingsStore.setState({ settings: newSettings });
  }
}

function keydownHandler(event: KeyboardEvent) {
  // Macに対応するためにmetaKeyもチェック
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const saveSettings = useSettingsStore.getState().saveSettings;
  const settings = useSettingsStore.getState().settings;

  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) return;

  if (
    (activeElement instanceof HTMLInputElement &&
      activeElement.type !== "checkbox") || // checkboxのみ除外
    activeElement.isContentEditable
  ) {
    if (
      event.key === "Escape" &&
      document.querySelector(".cm-tooltip-autocomplete") === null // キャプチャフェーズでないと取得できない
    ) {
      activeElement.blur();
    }

    return;
  }

  // タブ
  for (const { key, tab } of [
    {
      key: "g",
      tab: "general",
    },
    {
      key: "f",
      tab: "filter",
    },
    {
      key: "c",
      tab: "commentFilter",
    },
    {
      key: "v",
      tab: "videoFilter",
    },
    {
      key: "s",
      tab: "support",
    },
  ] as const) {
    if (event.key === key) {
      saveSettings({ selectedSettingsTab: tab });
    }
  }
  if (event.key === "a" && settings.showAdvancedFeatures) {
    saveSettings({ selectedSettingsTab: "advancedFeatures" });
  }

  // フィルター
  if (event.key === "t" && settings.selectedSettingsTab === "filter") {
    saveSettings({
      selectedFilter: settings.selectedFilter === "manual" ? "auto" : "manual",
    });
  }

  // 入力要素
  if (event.key === "/") {
    // ブラウザの検索欄へのフォーカスや/が入力されるのを防ぐ
    event.preventDefault();

    const input = document.querySelector("input:not([type='checkbox'])");
    if (input instanceof HTMLElement) {
      input.focus();
    }

    const codeMirror = document.querySelector(".cm-content");
    if (codeMirror instanceof HTMLElement) {
      codeMirror.focus();
    }
  }
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

const config = [
  {
    id: "general",
    name: "一般設定",
    key: "g",
  },
  {
    id: "filter",
    name: "フィルター",
    key: "f",
  },
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
  {
    id: "advancedFeatures",
    name: "高度な機能",
    key: "a",
  },
  {
    id: "support",
    name: "サポート",
    key: "s",
  },
] satisfies {
  id: SettingsTab;
  name: string;
  key: string;
}[];
