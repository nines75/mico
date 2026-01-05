import type { Settings } from "../types/storage/settings.types.js";

export const defaultSettings: Settings = {
    // -------------------------------------------------------------------------------------------
    // 一般設定
    // -------------------------------------------------------------------------------------------

    // エディター
    isCloseBrackets: true,
    isHighlightTrailingWhitespace: true,
    isVimModeEnabled: false,

    // クイック編集
    isConfirmCloseQuickEdit: false,

    // 高度な機能
    isAdvancedFeaturesVisible: false,
    isImeDisabledByContext: false,

    // -------------------------------------------------------------------------------------------
    // コメントフィルター
    // -------------------------------------------------------------------------------------------

    isCommentFilterEnabled: true,

    // フィルタリング
    isEasyCommentHidden: false,
    isCommentAssistFilterEnabled: false,
    isScoreFilterEnabled: false,
    scoreFilterCount: -4800,
    isMyCommentIgnored: true,
    isIgnoreByNicoru: false,
    ignoreByNicoruCount: 30,
    selectedCommentFilter: "ngUserId",
    ngUserId: "",
    ngCommand: "",
    ngWord: "",

    // ログ
    isNgScoreVisible: true,
    isNicoruVisible: true,
    nicoruVisibleCount: 30,
    isDuplicateVisible: true,
    duplicateVisibleCount: 2,

    // 通知
    isNotifyAddNgUserId: true,
    isNotifyAutoAddNgUserId: true,

    // ドロップダウン
    isAutoReload: false,
    isUserIdMountedToDropdown: false,
    isNgScoreMountedToDropdown: false,

    // その他
    isCommentNgContextAppended: false,

    // -------------------------------------------------------------------------------------------
    // 動画フィルター
    // -------------------------------------------------------------------------------------------

    isVideoFilterEnabled: true,

    // フィルタリング
    isPaidVideoHidden: false,
    isCommentPreviewHidden: false,
    isViewsFilterEnabled: false,
    viewsFilterCount: 1000,
    selectedVideoFilter: "ngId",
    ngId: "",
    ngTitle: "",
    ngUserName: "",

    // ログ
    isTitleRenderedAsLink: false,

    // 通知
    isNotifyAddNgId: true,

    // その他
    isNgContextAppendedOnAdd: false,

    // -------------------------------------------------------------------------------------------
    // 拡張ニコる
    // -------------------------------------------------------------------------------------------

    isExpandNicoruEnabled: false,

    // スタイル
    isCommentBodyHighlighted: true,
    nicoruCounts: [300, 200, 100, 50, 30, 15], // 降順である必要がある
    nicoruColors: {
        // 明示的に設定しないとリセット時に前の値を上書きできない
        "15": {
            primary: "#fcc442",
            secondary: "",
            isGradient: false,
        },
        "30": {
            primary: "#fcb242",
            secondary: "",
            isGradient: false,
        },
        "50": {
            primary: "#fc9f42",
            secondary: "",
            isGradient: false,
        },
        "100": {
            primary: "#ffee9d",
            secondary: "#d9a300",
            isGradient: true,
        },
        "200": {
            primary: "#ffcccc",
            secondary: "#ff8080",
            isGradient: true,
        },
        "300": {
            primary: "#ff8080",
            secondary: "#ff0000",
            isGradient: true,
        },
    },

    // -------------------------------------------------------------------------------------------
    // その他
    // -------------------------------------------------------------------------------------------

    // タブ
    selectedSettingsTab: "general",
    selectedPopupTab: "commentFilter",
    selectedQuickEditTab: "commentFilter",

    // 開閉
    isProcessingTimeOpen: false,
    isCountOpen: true,
    isLogOpen: true,
} as const;

export const buttons = {
    addNgUserId: "ユーザーをNG登録($1)",
    addSpecificNgUserId: "この動画だけユーザーをNG登録($1)",
    showComments: "ユーザーが投稿したコメント($1)",
} as const;

export const messages = {
    ngId: {
        additionSuccess: "以下のIDをNG登録しました\n\n$1",
        extractionFailed: "IDの抽出に失敗しました",
    },
    ngUserId: {
        // 登録
        additionSuccess: "ユーザーのNG登録に成功しました",
        additionFailed: "ユーザーのNG登録に失敗しました",
        notifyAddition: "$1件のユーザーIDをNG登録しました",
        confirmAddition: "以下のユーザーIDをNG登録しますか？\n\n$1",
        getInfoFailed: "ユーザー情報の取得に失敗しました",

        // 削除
        confirmRemoval: "以下のNGユーザーIDを削除しますか？\n\n$1",

        undoStrict:
            "strictルールによってNG登録されたユーザーIDを削除します。\n以下のNGユーザーIDを削除しますか？\n\n$1",
        alreadyAdded: "このユーザーIDは既にNG登録されています",
        cannotGetUserId: "このコメントのユーザーIDは取得できません",
    },
    ngVideoId: {
        additionFailed: "動画のNG登録に失敗しました",
        confirmAddition: "以下の動画IDをNG登録しますか？\n\n$1",
        confirmRemoval: "以下のNG動画IDを削除しますか？\n\n$1",
        getInfoFailed: "動画情報の取得に失敗しました",
    },
    settings: {
        neverReset: "設定が一度も変更されていません",
        confirmReset:
            "ストレージに保存されている全てのデータを削除します。\nこの操作により、この拡張機能の設定やログがリセットされます。\n続行しますか？",

        // 拡張ニコる
        numberTooBig: "入力された数値が大きすぎます",
        valueAlreadyExists: "すでに存在する値です",
        resetNicoruCounts:
            "拡張ニコるの基準値や配色の設定がリセットされます。\n続行しますか？",
    },
    popup: {
        notWorking: "このページでは動作しません",
        outdatedLog: "表示されているログは古いものである可能性があります",
    },
    quickEdit: {
        confirmClose: "クイック編集を閉じますか？",
    },
    other: {
        permissionRequired: "以下の権限が必要です\n\n$1",
        getCommentFailed: "コメントの取得に失敗しました",
    },
} as const;

export const titles = {
    // 登録
    addNgUserIdByComment: "クリックしてこのコメントを投稿したユーザーをNG登録",
    addNgUserIdByVideo: "クリックしてこの動画を投稿したユーザーをNG登録",
    addNgVideo: "クリックしてこの動画をNG登録",

    // 削除
    removeNgUserId: "クリックしてNGユーザーIDを削除",
    removeNgVideoId: "クリックしてNG動画IDを削除",

    // ログ
    ngScore: "NGスコア",
    nicoruCount: "ニコるの数",
    duplicateComments: "本文が重複したコメントの数",
    strictSymbol: "strictルールによってNG登録されたユーザーID",

    undoStrict: "strictルールによってNG登録されたユーザーIDを削除します",
} as const;

export const colors = {
    commentBadge: "#b22222",
    videoBadge: "#00ffff",
} as const;

export const urls = {
    repository: "https://github.com/nines75/mico",
    changeLog: "https://github.com/nines75/mico/releases",
    wiki: "https://github.com/nines75/mico/wiki",
    issues: "https://github.com/nines75/mico/issues",
    discussions: "https://github.com/nines75/mico/discussions",
} as const;
