import { CommentFilterId } from "@/entrypoints/options/components/ui/CommentFilterArea.js";
import { VideoFilterId } from "@/entrypoints/options/components/ui/VideoFilterArea.js";

export type FilterTab = "commentFilter" | "videoFilter";
export type SettingsTab =
    | "general"
    | "commentFilter"
    | "videoFilter"
    | "expandNicoru"
    | "support";

export interface Settings {
    // -------------------------------------------------------------------------------------------
    // 一般設定
    // -------------------------------------------------------------------------------------------

    // フィルタリング
    isCaseInsensitive: boolean;

    // エディター
    isCloseBrackets: boolean;
    isHighlightTrailingWhitespace: boolean;
    isVimModeEnabled: boolean;

    // クイック編集
    isConfirmCloseQuickEdit: boolean;

    // 高度な機能
    isAdvancedFeaturesVisible: boolean;
    isImeDisabledByContext: boolean;

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
    selectedCommentFilter: CommentFilterId;
    ngUserId: string;
    ngCommand: string;
    ngWord: string;

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
    selectedVideoFilter: VideoFilterId;
    ngId: string;
    ngUserName: string;
    ngTitle: string;

    // ログ
    isTitleRenderedAsLink: boolean;

    // 通知
    isNotifyAddNgId: boolean;

    // その他
    isNgContextAppendedOnAdd: boolean;

    // -------------------------------------------------------------------------------------------
    // 拡張ニコる
    // -------------------------------------------------------------------------------------------

    isExpandNicoruEnabled: boolean;

    // スタイル
    isCommentBodyHighlighted: boolean;
    nicoruCounts: number[];
    nicoruColors: Record<string, NicoruColor>;

    // -------------------------------------------------------------------------------------------
    // その他
    // -------------------------------------------------------------------------------------------

    // タブ
    selectedSettingsTab: SettingsTab;
    selectedPopupTab: FilterTab;
    selectedQuickEditTab: FilterTab;

    // 開閉
    isProcessingTimeOpen: boolean;
    isCountOpen: boolean;
    isLogOpen: boolean;
}

export interface NicoruColor {
    primary?: string;
    secondary?: string;
    isGradient?: boolean;
}
