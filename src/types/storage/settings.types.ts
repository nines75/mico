import { FilterId } from "@/entrypoints/options/components/ui/FilterArea.js";

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

    // 拡張ニコる
    isExpandNicoruEnabled: boolean;
    nicoruCounts: number[];
    nicoruColors: Record<string, NicoruColor | undefined>; // undefinedとのユニオン型にしないとimportBackup関数でエラーになる

    // 設定の開閉設定
    isOpenNgUserIdFilter: boolean;
    isOpenNgCommandFilter: boolean;
    isOpenNgWordFilter: boolean;
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
