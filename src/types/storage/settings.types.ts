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
    isCloseBrackets: boolean;
    isHighlightTrailingWhitespace: boolean;

    // 高度な機能
    isAdvancedFeaturesVisible: boolean;
    shouldImportLocalFilterOnLoad: boolean;
    shouldImportOnlyWhenWslRunning: boolean;
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

    isCommentFilterEnabled: boolean;

    // フィルタリング
    isEasyCommentHidden: boolean;
    isCommentAssistFilterEnabled: boolean;
    isScoreFilterEnabled: boolean;
    scoreFilterCount: number;
    isMyCommentIgnored: boolean;
    isIgnoreByNicoru: boolean;
    ignoreByNicoruCount: number;

    // 通知
    isNotifyAddNgUserId: boolean;
    isNotifyAutoAddNgUserId: boolean;

    // ドロップダウン
    isAutoReload: boolean;
    isUserIdMountedToDropdown: boolean;
    isNgScoreMountedToDropdown: boolean;

    // -------------------------------------------------------------------------------------------
    // 動画フィルター
    // -------------------------------------------------------------------------------------------

    isVideoFilterEnabled: boolean;

    // フィルタリング
    isPaidVideoHidden: boolean;
    isCommentPreviewHidden: boolean;
    isViewsFilterEnabled: boolean;
    viewsFilterCount: number;

    // 通知
    isNotifyAddNgId: boolean;

    // -------------------------------------------------------------------------------------------
    // その他
    // -------------------------------------------------------------------------------------------

    // タブ
    selectedSettingsTab: SettingsTab;
}
