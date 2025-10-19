import { CommentFilterId } from "@/entrypoints/options/components/ui/CommentFilterArea.js";
import { VideoFilterId } from "@/entrypoints/options/components/ui/VideoFilterArea.js";
import {
    FilterTab,
    NicoruColor,
    Settings,
    SettingsTab,
} from "./settings.types.js";
import { customMerge } from "@/utils/storage.js";

export interface SettingsV1 {
    // -------------------------------------------------------------------------------------------
    // 一般設定
    // -------------------------------------------------------------------------------------------

    // フィルタリング
    isCaseInsensitive: boolean;

    // エディター
    isCloseBrackets: boolean;
    isHighlightTrailingWhitespace: boolean;
    isVimKeybindingsEnabled: boolean;

    // 高度な機能
    isAdvancedFeatureVisible: boolean;
    isDisableImeByContext: boolean;

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
    nicoruColors: Record<string, NicoruColorV1>;

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

interface NicoruColorV1 {
    primary?: string;
    secondary?: string;
    isGradate?: boolean;
}

const keyMapToV2 = [
    ["isVimKeybindingsEnabled", "isVimModeEnabled"],
    ["isAdvancedFeatureVisible", "isAdvancedFeaturesVisible"],
    ["isDisableImeByContext", "isImeDisabledByContext"],
    ["isHideEasyComment", "isEasyCommentHidden"],
    ["isAddEasyCommentCount", "isHiddenEasyCommentAdded"],
    ["IgnoreByNicoruCount", "ignoreByNicoruCount"],
    ["isShowNgScoreInLog", "isNgScoreVisible"],
    ["isShowNicoruInLog", "isNicoruVisible"],
    ["showNicoruInLogCount", "nicoruVisibleCount"],
    ["isShowDuplicateInLog", "isDuplicateVisible"],
    ["showDuplicateInLogCount", "duplicateVisibleCount"],
    ["isShowUserIdInDropdown", "isUserIdMountedToDropdown"],
    ["isHidePaidVideo", "isPaidVideoHidden"],
    ["isHideCommentPreview", "isCommentPreviewHidden"],
    ["isRenderTitleAsLink", "isTitleRenderedAsLink"],
    ["isAddNgContext", "isNgContextAppendedOnAdd"],
    ["isSpoofVideoId", "isVideoIdSpoofed"],
    ["isHighlightCommentBody", "isCommentBodyHighlighted"],
    ["isOpenProcessingTime", "isProcessingTimeOpen"],
    ["isOpenCount", "isCountOpen"],
    ["isOpenVideoLog", "isLogOpen"],
] satisfies [keyof SettingsV1, keyof Settings][];

export function migrationSettingsToV2(v1: Partial<SettingsV1>) {
    const v2: Record<string, unknown> = {};
    keyMapToV2.forEach(([v1Key, v2Key]) => {
        const value = v1[v1Key];
        if (value !== undefined) {
            v2[v2Key] = value;
        }
    });

    if (v1.nicoruColors !== undefined) {
        v2["nicoruColors"] = {};
        const nicoruColors = v2["nicoruColors"] as Record<string, NicoruColor>;

        Object.entries(v1.nicoruColors).forEach(([count, color]) => {
            const isGradate = color.isGradate;
            if (isGradate !== undefined)
                nicoruColors[count] = { isGradient: isGradate };
        });
    }

    return customMerge(v1 as unknown, v2);
}
