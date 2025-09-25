import { CommentFilterId } from "@/entrypoints/options/components/ui/CommentFilterArea.js";
import { VideoFilterId } from "@/entrypoints/options/components/ui/VideoFilterArea.js";

export type FilterTab = "commentFilter" | "videoFilter";
export type SettingsTab =
    | "general"
    | "commentFilter"
    | "videoFilter"
    | "expandNicoru"
    | "backup";

export interface Settings {
    // -------------------------------------------------------------------------------------------
    // 一般設定
    // -------------------------------------------------------------------------------------------

    // フィルタリング
    isCaseInsensitive: boolean;

    // エディター
    isCloseBrackets: boolean;
    isHighlightTrailingWhitespace: boolean;
    isVimKeybindingsEnabled: boolean;

    // -------------------------------------------------------------------------------------------
    // コメントフィルター
    // -------------------------------------------------------------------------------------------

    isCommentFilterEnabled: boolean;

    // フィルタリング
    isHideEasyComment: boolean;
    isAddEasyCommentCount: boolean;
    isScoreFilterEnabled: boolean;
    scoreFilterCount: number;
    isIgnoreByNicoru: boolean;
    IgnoreByNicoruCount: number;
    selectedCommentFilter: CommentFilterId;
    ngUserId: string;
    ngCommand: string;
    ngWord: string;

    // ログ
    isShowNgScoreInLog: boolean;
    isShowNicoruInLog: boolean;
    showNicoruInLogCount: number;
    isShowDuplicateInLog: boolean;
    showDuplicateInLogCount: number;

    // 通知
    isNotifyAddNgUserId: boolean;
    isNotifyAutoAddNgUserId: boolean;

    // その他
    isAutoReload: boolean;
    isShowUserIdInDropdown: boolean;

    // -------------------------------------------------------------------------------------------
    // 動画フィルター
    // -------------------------------------------------------------------------------------------

    isVideoFilterEnabled: boolean;

    // フィルタリング
    isHidePaidVideo: boolean;
    isHideCommentPreview: boolean;
    isViewsFilterEnabled: boolean;
    viewsFilterCount: number;
    selectedVideoFilter: VideoFilterId;
    ngId: string;
    ngUserName: string;
    ngTitle: string;

    // ログ
    isRenderTitleAsLink: boolean;

    // 通知
    isNotifyAddNgId: boolean;

    // その他
    isAddNgContext: boolean;
    isSpoofVideoId: boolean;

    // -------------------------------------------------------------------------------------------
    // 拡張ニコる
    // -------------------------------------------------------------------------------------------

    isExpandNicoruEnabled: boolean;

    // スタイル
    isHighlightCommentBody: boolean;
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
    isOpenProcessingTime: boolean;
    isOpenCount: boolean;
    isOpenVideoLog: boolean;
}

interface NicoruColor {
    primary?: string;
    secondary?: string;
    isGradate?: boolean;
}
