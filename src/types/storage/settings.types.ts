import type { AutoRule } from "@/entrypoints/background/rule";
import type { FilterId } from "@/entrypoints/options/components/tabs/Filter";

export type SettingsTab =
  | "general"
  | "filter"
  | "commentFilter"
  | "videoFilter"
  | "advancedFeatures"
  | "support";

export interface Settings {
  // -------------------------------------------------------------------------------------------
  // 一般設定
  // -------------------------------------------------------------------------------------------

  // 通知
  notifyOnManualNg: boolean;
  notifyOnAutoNg: boolean;

  // その他
  showAdvancedFeatures: boolean;
  complementContext: boolean;

  // -------------------------------------------------------------------------------------------
  // フィルター
  // -------------------------------------------------------------------------------------------

  selectedFilter: FilterId;

  // Manual
  manualFilter: string;
  showParsingHints: boolean;

  // Auto
  autoFilter: Partial<AutoRule>[];

  // -------------------------------------------------------------------------------------------
  // コメントフィルター
  // -------------------------------------------------------------------------------------------

  enableCommentFilter: boolean;

  // フィルタリング
  enableEasyCommentFilter: boolean;
  enableCommentAssistFilter: boolean;
  enableScoreFilter: boolean;
  scoreFilterThreshold: number;
  enableVposFilter: boolean;
  ignoreMyComments: boolean;
  ignoreByNicoru: boolean;
  ignoreByNicoruThreshold: number;

  // ドロップダウン
  showUserIdInDropdown: boolean;
  showScoreInDropdown: boolean;
  autoReload: boolean;

  // -------------------------------------------------------------------------------------------
  // 動画フィルター
  // -------------------------------------------------------------------------------------------

  enableVideoFilter: boolean;

  // フィルタリング
  hideCommentPreview: boolean;
  enablePaidFilter: boolean;
  enableShortsFilter: boolean;
  enableViewCountFilter: boolean;
  viewCountFilterThreshold: number;

  // -------------------------------------------------------------------------------------------
  // 高度な機能
  // -------------------------------------------------------------------------------------------

  importLocalFilterOnLoad: boolean;
  importOnlyWhenWslRunning: boolean;
  localFilterPath: string;
  saveBackupOnStartup: boolean;
  saveBackupOnlyAfterInterval: boolean;
  backupIntervalThreshold: number;
  saveBackupWithoutManualFilter: boolean;
  backupPath: string;

  // -------------------------------------------------------------------------------------------
  // その他
  // -------------------------------------------------------------------------------------------

  storeId: string;

  // タブ
  selectedSettingsTab: SettingsTab;

  // アナウンス
  showAnnouncement: boolean;
}
