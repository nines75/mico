import type { AutoRule } from "@/entrypoints/background/rule";
import type { FilterId } from "@/entrypoints/options/components/ui/FilterArea";

export type SettingsTab =
    | "general"
    | "filter"
    | "commentFilter"
    | "videoFilter"
    | "support";

export interface Settings {
    // -------------------------------------------------------------------------------------------
    // 一般設定
    // -------------------------------------------------------------------------------------------

    // エディター
    enableCloseBrackets: boolean;
    enableHighlightTrailingWhitespace: boolean;

    // 通知
    notifyOnManualNg: boolean;
    notifyOnAutoNg: boolean;

    // 高度な機能
    showAdvancedFeatures: boolean;
    importLocalFilterOnLoad: boolean;
    importOnlyWhenWslRunning: boolean;
    localFilterPath: string;

    // -------------------------------------------------------------------------------------------
    // フィルター
    // -------------------------------------------------------------------------------------------

    selectedFilter: FilterId;
    manualFilter: string;
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
    ignoreMyComments: boolean;
    ignoreByNicoru: boolean;
    ignoreByNicoruThreshold: number;

    // ドロップダウン
    autoReload: boolean;
    showUserIdInDropdown: boolean;
    showScoreInDropdown: boolean;

    // -------------------------------------------------------------------------------------------
    // 動画フィルター
    // -------------------------------------------------------------------------------------------

    enableVideoFilter: boolean;

    // フィルタリング
    enablePaidFilter: boolean;
    hideCommentPreview: boolean;
    enableViewCountFilter: boolean;
    viewCountFilterThreshold: number;

    // -------------------------------------------------------------------------------------------
    // その他
    // -------------------------------------------------------------------------------------------

    // タブ
    selectedSettingsTab: SettingsTab;
}
