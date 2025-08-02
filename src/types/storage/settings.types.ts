import { CommentFilterId } from "@/entrypoints/options/components/ui/CommentFilterArea.js";
import { VideoFilterId } from "@/entrypoints/options/components/ui/VideoFilterArea.js";

export type PopupTab = "commentFilter" | "videoFilter";
export type SettingsTab =
    | "general"
    | "commentFilter"
    | "videoFilter"
    | "expandNicoru"
    | "backup";

export interface Settings {
    // コメントフィルター

    isCommentFilterEnabled: boolean;

    /// フィルタリング
    isCaseInsensitive: boolean;
    isHideEasyComment: boolean;
    isIgnoreByNicoru: boolean;
    IgnoreByNicoruCount: number;
    isScoreFilterEnabled: boolean;
    scoreFilterCount: number;
    isVimKeybindingsEnabled: boolean;
    selectedCommentFilter: CommentFilterId;
    ngUserId: string;
    ngCommand: string;
    ngWord: string;

    /// ログ
    isShowNgScoreInLog: boolean;
    isShowNicoruInLog: boolean;
    showNicoruInLogCount: number;
    isShowDuplicateInLog: boolean;
    showDuplicateInLogCount: number;

    /// 通知
    isNotifyAddNgUserId: boolean;
    isNotifyAutoAddNgUserId: boolean;

    /// その他
    isAutoReload: boolean;
    isPartialBadgeCount: boolean;
    isShowUserIdInDropdown: boolean;

    // 動画フィルター

    isVideoFilterEnabled: boolean;
    isHidePaidVideo: boolean;
    isViewsFilterEnabled: boolean;
    viewsFilterCount: number;
    isAddNgContext: boolean;

    /// フィルタリング
    selectedVideoFilter: VideoFilterId;
    ngId: string;
    ngUserName: string;
    ngTitle: string;

    // 拡張ニコる
    isExpandNicoruEnabled: boolean;
    nicoruCounts: number[];
    nicoruColors: Record<string, NicoruColor>;

    // 設定

    /// タブ
    settingsSelectedTab: SettingsTab;

    // ポップアップ

    /// 開閉設定
    isOpenProcessingTime: boolean;
    isOpenCount: boolean;
    isOpenVideoLog: boolean;

    // タブ
    popupSelectedTab: PopupTab;
}

interface NicoruColor {
    primary?: string;
    secondary?: string;
    isGradate?: boolean;
}
