import type { AutoRule } from "@/entrypoints/background/rule";
import type { FilterId } from "@/entrypoints/options/components/ui/FilterArea";

export type FilterTab = "commentFilter" | "videoFilter";
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

    // ログ
    isNgScoreVisible: boolean;
    isNicoruVisible: boolean;
    nicoruVisibleCount: number;
    isDuplicateVisible: boolean;
    duplicateVisibleCount: number;

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

    // ログ
    isTitleRenderedAsLink: boolean;

    // 通知
    isNotifyAddNgId: boolean;

    // -------------------------------------------------------------------------------------------
    // その他
    // -------------------------------------------------------------------------------------------

    // タブ
    selectedSettingsTab: SettingsTab;
    selectedPopupTab: FilterTab;

    // 開閉
    isProcessingTimeOpen: boolean;
    isCountOpen: boolean;
    isLogOpen: boolean;

    // 表示
    isUserIdFilterVisible: boolean;
    isEasyCommentFilterVisible: boolean;
    isCommentAssistFilterVisible: boolean;
    isScoreFilterVisible: boolean;
    isCommandFilterVisible: boolean;
    isWordFilterVisible: boolean;
    isIdFilterVisible: boolean;
    isPaidFilterVisible: boolean;
    isViewsFilterVisible: boolean;
    isUserNameFilterVisible: boolean;
    isTitleFilterVisible: boolean;
}
