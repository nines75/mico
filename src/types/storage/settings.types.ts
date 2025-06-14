import { FilterId } from "@/entrypoints/options/components/ui/FilterArea.js";
import { VideoFilterId } from "@/entrypoints/options/components/ui/VideoFilterArea.js";

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
    defaultFilter: FilterId;
    ngUserId: string;
    ngCommand: string;
    ngWord: string;

    /// ログ
    isSaveFilteringLog: boolean;
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

    /// フィルタリング
    defaultVideoFilter: VideoFilterId;
    ngVideoFilterId: string;
    ngUserName: string;
    ngTitle: string;

    // 拡張ニコる
    isExpandNicoruEnabled: boolean;
    nicoruCounts: number[];
    nicoruColors: Record<string, NicoruColor | undefined>; // undefinedとのユニオン型にしないとimportBackup関数でエラーになる

    // 設定の開閉設定
    isOpenCustomColor: boolean;

    // ポップアップの開閉設定
    isOpenProcessingTime: boolean;
    isOpenCount: boolean;
    isOpenVideoLog: boolean;
}

interface NicoruColor {
    primary?: string;
    secondary?: string;
    isGradate?: boolean;
}
