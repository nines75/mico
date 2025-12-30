import type { CommentFilterId } from "@/entrypoints/options/components/ui/CommentFilterArea.js";
import type { VideoFilterId } from "@/entrypoints/options/components/ui/VideoFilterArea.js";
import type {
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
    ["isHighlightCommentBody", "isCommentBodyHighlighted"],
    ["isOpenProcessingTime", "isProcessingTimeOpen"],
    ["isOpenCount", "isCountOpen"],
    ["isOpenVideoLog", "isLogOpen"],
] satisfies [keyof SettingsV1, keyof Settings][];

export function migrateSettingsToV2(v1: Partial<SettingsV1>) {
    const v2: Record<string, unknown> = {};
    keyMapToV2.forEach(([v1Key, v2Key]) => {
        const value = v1[v1Key];
        if (value !== undefined) {
            v2[v2Key] = value;
        }
    });

    if (v1.nicoruColors !== undefined) {
        v2.nicoruColors = {};
        const nicoruColors = v2.nicoruColors as Record<string, NicoruColor>;

        Object.entries(v1.nicoruColors).forEach(([count, color]) => {
            const isGradate = color.isGradate;
            if (isGradate !== undefined)
                nicoruColors[count] = { isGradient: isGradate };
        });
    }

    return customMerge(v1 as unknown, v2);
}

export function migrateSettingsToV3(v2: Partial<Settings>) {
    const migrateFilter = (
        filter: string,
        lineEditor: (line: string) => string,
    ) => {
        return filter
            .split("\n")
            .map((line) => {
                if (line.startsWith("#")) return line;
                return lineEditor(line);
            })
            .join("\n");
    };
    const migrateVideoSpecificRule = (line: string) => {
        const result = /^(.+)@(.+)$/.exec(line);
        const videoId = result?.[1];
        const rule = result?.[2];

        if (videoId !== undefined && rule !== undefined) {
            return `@v ${videoId}\n${rule}`;
        } else {
            return line;
        }
    };
    const migrateStrictAlias = (line: string) => {
        const result = /^!(.+)$/.exec(line);
        const rule = result?.[1];

        if (rule !== undefined) {
            return `@s\n${rule}`;
        } else {
            return line;
        }
    };

    const v3 = {
        ngUserId: migrateFilter(v2.ngUserId ?? "", migrateVideoSpecificRule),
        ngCommand: migrateFilter(v2.ngCommand ?? "", migrateStrictAlias),
        ngWord: migrateFilter(v2.ngWord ?? "", migrateStrictAlias),
    } satisfies Partial<Settings>;

    return customMerge(v2 as unknown, v3);
}
