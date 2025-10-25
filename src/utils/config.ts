import { CommentLogViewerProps } from "@/entrypoints/popup/components/CommentLogViewer.js";
import {
    FilterTab,
    Settings,
    SettingsTab,
} from "../types/storage/settings.types.js";
import { CheckboxProps } from "@/entrypoints/options/components/ui/Checkbox.js";
import { CommentFilterAreaProps } from "@/entrypoints/options/components/ui/CommentFilterArea.js";
import { VideoFilterAreaProps } from "@/entrypoints/options/components/ui/VideoFilterArea.js";
import { VideoLogViewerProps } from "@/entrypoints/popup/components/VideoLogViewer.js";

export const defaultSettings: Settings = {
    // -------------------------------------------------------------------------------------------
    // 一般設定
    // -------------------------------------------------------------------------------------------

    // フィルタリング
    isCaseInsensitive: true,

    // エディター
    isCloseBrackets: true,
    isHighlightTrailingWhitespace: true,
    isVimModeEnabled: false,

    // 高度な機能
    isAdvancedFeaturesVisible: false,
    isImeDisabledByContext: false,

    // -------------------------------------------------------------------------------------------
    // コメントフィルター
    // -------------------------------------------------------------------------------------------

    isCommentFilterEnabled: true,

    // フィルタリング
    isEasyCommentHidden: false,
    isHiddenEasyCommentAdded: true,
    isScoreFilterEnabled: false,
    scoreFilterCount: -4800,
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

    // その他
    isAutoReload: false,
    isUserIdMountedToDropdown: false,

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
    AddNgUserId: "ユーザーをNG登録({target})",
    AddSpecificNgUserId: "この動画だけユーザーをNG登録({target})",
} as const;

export const messages = {
    ngId: {
        additionSuccess: `以下のIDをNG登録しました\n\n{target}`,
        extractionFailed: "IDの抽出に失敗しました",
    },
    ngUserId: {
        // 追加
        additionSuccess: "ユーザーのNG登録に成功しました",
        additionFailed: "ユーザーのNG登録に失敗しました",
        notifyAddition: "{target}件のユーザーIDをNG登録しました",
        confirmAddition: "以下のユーザーIDをNG登録しますか？\n\n{target}",
        confirmAdditionByVideo: "この動画を投稿したユーザーをNG登録しますか？",

        // 削除
        confirmRemoval: "以下のNGユーザーIDを削除しますか？\n\n{target}",

        undoStrict:
            "strictルールによって自動追加されたNGユーザーIDを削除します。\n以下のNGユーザーIDを削除しますか？\n\n{target}",
        alreadyAdded: "このユーザーIDは既にNG登録されています",
    },
    ngVideoId: {
        additionFailed: "動画のNG登録に失敗しました",
        confirmAddition: "この動画をNG登録しますか？",
        confirmRemoval: "以下のNG動画IDを削除しますか？\n\n{target}",
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
    other: {
        permissionRequired: "以下の権限が必要です\n\n{target}",
    },
} as const;

export const titles = {
    // 追加
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

    undoStrict: "strictルールによって自動追加されたNGユーザーIDを削除します",
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

export const pattern = {
    topPageUrl: "https://www.nicovideo.jp/",
    topPageUrlGlob: "https://www.nicovideo.jp/*",
    watchPageUrl: "https://www.nicovideo.jp/watch/",
    watchPageUrlGlob: "https://www.nicovideo.jp/watch/*",
    rankingPageUrl: "https://www.nicovideo.jp/ranking/genre",
    searchPageUrl: "https://www.nicovideo.jp/search/",
    tagSearchPageUrl: "https://www.nicovideo.jp/tag/",
    userPageUrlGlob: "https://www.nicovideo.jp/user/*",
    channelPageUrlGlob: "https://ch.nicovideo.jp/channel/*",
    regex: {
        checkRawUserId: /^(?:ch)?\d+$/,
        checkVideoId: /^(?:sm|so|nl|nm)\d+$/,
        extractUserId: /^https:\/\/www\.nicovideo\.jp\/user\/(\d+)$/,
        extractId:
            /^https:\/\/(?:www\.nicovideo\.jp\/user|www\.nicovideo\.jp\/watch|ch\.nicovideo\.jp\/channel)\/([^?]+)/,
    },
} as const;

export const settingsConfig = {
    tab: [
        {
            id: "general",
            name: "一般設定",
        },
        {
            id: "commentFilter",
            name: "コメントフィルター",
        },
        {
            id: "videoFilter",
            name: "動画フィルター",
        },
        {
            id: "expandNicoru",
            name: "拡張ニコる",
        },
        {
            id: "support",
            name: "サポート",
        },
    ],
} as const satisfies {
    tab: {
        id: SettingsTab;
        name: string;
    }[];
};

export const generalSettings = {
    checkbox: {
        filtering: [
            {
                id: "isCaseInsensitive",
                label: "大小文字を区別しない",
                details:
                    "正規表現が使用可能なフィルターに対してのみ有効になります。",
            },
        ],
        editor: [
            {
                id: "isCloseBrackets",
                label: "括弧を自動で閉じる",
            },
            {
                id: "isHighlightTrailingWhitespace",
                label: "行末の空白文字をハイライトする",
            },
            {
                id: "isVimModeEnabled",
                label: "Vimモードを有効にする",
            },
        ],
        advanced: {
            top: [
                {
                    id: "isAdvancedFeaturesVisible",
                    label: "高度な機能を表示する",
                },
            ],
            features: [
                {
                    id: "isImeDisabledByContext",
                    label: "コンテキストに応じてIMEを無効化する",
                    details: `Vimモードでのみ有効となり、ノーマルモードに戻った際やエディターにフォーカスした際にIMEが無効化されます。
                    ネイティブメッセージング権限とバイナリのインストールが必要です。`,
                },
            ],
        },
    },
} as const satisfies {
    checkbox: {
        filtering: CheckboxProps[];
        editor: CheckboxProps[];
        advanced: {
            top: CheckboxProps[];
            features: CheckboxProps[];
        };
    };
};

export const commentFilterSettings = {
    checkbox: {
        top: [
            {
                id: "isCommentFilterEnabled",
                label: "コメントフィルターを有効にする",
            },
        ],
        filtering: [
            {
                id: "isEasyCommentHidden",
                label: "かんたんコメントを非表示にする",
                childrenProps: [
                    {
                        id: "isHiddenEasyCommentAdded",
                        label: "非表示にした数をバッジに加算する",
                    },
                ],
            },
            {
                id: "isScoreFilterEnabled",
                label: "NGスコアによるフィルタリングを有効にする",
                input: {
                    id: "scoreFilterCount",
                    label: "以下の場合にフィルタリング",
                    max: 0,
                },
            },
            {
                id: "isIgnoreByNicoru",
                label: "ニコるの数に応じてフィルタリングの対象外にする",
                details: "かんたんコメントの非表示には影響しません。",
                input: {
                    id: "ignoreByNicoruCount",
                    label: "回以上ニコられていた場合に除外",
                    min: 0,
                },
            },
        ],
        log: [
            {
                id: "isNgScoreVisible",
                label: "NGスコアを表示する",
            },
            {
                id: "isNicoruVisible",
                label: "ニコるの数を表示する",
                input: {
                    id: "nicoruVisibleCount",
                    label: "回以上ニコられていた場合に表示",
                    min: 0,
                },
            },
            {
                id: "isDuplicateVisible",
                label: "本文が重複したコメントの数を表示する",
                input: {
                    id: "duplicateVisibleCount",
                    label: "回以上重複していた場合に表示",
                    min: 1,
                },
            },
        ],
        notification: [
            {
                id: "isNotifyAddNgUserId",
                label: "NGユーザーIDの手動追加時に通知する",
            },
            {
                id: "isNotifyAutoAddNgUserId",
                label: "NGユーザーIDの自動追加時に通知する",
            },
        ],
        other: [
            {
                id: "isAutoReload",
                label: "自動リロードを有効にする",
                details: `ドロップダウンのユーザーNGボタンを押した際に自動でリロードします。
                読み込み後、リロードする前の再生時間が自動で再設定されます。`,
            },
            {
                id: "isUserIdMountedToDropdown",
                label: "ドロップダウンにユーザーIDを表示する",
            },
        ],
    },
    filter: [
        {
            id: "ngUserId",
            name: "NGユーザーID",
        },
        {
            id: "ngCommand",
            name: "NGコマンド",
        },
        {
            id: "ngWord",
            name: "NGワード(正規表現)",
        },
    ],
} as const satisfies {
    checkbox: {
        top: CheckboxProps[];
        filtering: CheckboxProps[];
        log: CheckboxProps[];
        notification: CheckboxProps[];
        other: CheckboxProps[];
    };
    filter: CommentFilterAreaProps[];
};

export const videoFilterSettings = {
    checkbox: {
        top: [
            {
                id: "isVideoFilterEnabled",
                label: "動画フィルターを有効にする",
            },
        ],
        filtering: [
            {
                id: "isPaidVideoHidden",
                label: "有料動画を非表示にする",
            },
            {
                id: "isCommentPreviewHidden",
                label: "コメントプレビューを非表示にする",
            },
            {
                id: "isViewsFilterEnabled",
                label: "再生回数によるフィルタリングを有効にする",
                details: "対象となるのは視聴ページの関連動画のみです。",
                input: {
                    id: "viewsFilterCount",
                    label: "再生以下だった場合にフィルタリング",
                    min: 0,
                },
            },
        ],
        log: [
            {
                id: "isTitleRenderedAsLink",
                label: "動画タイトルをリンクとして表示する",
                details:
                    "動画タイトルをクリックしてNG登録/解除することは出来なくなります。",
            },
        ],
        notification: [
            {
                id: "isNotifyAddNgId",
                label: "NG登録時に通知する",
                details:
                    "コンテキストメニューやクリップボードからNG登録した際に通知されます。",
            },
        ],
        other: [
            {
                id: "isNgContextAppendedOnAdd",
                label: "NG追加時にコンテキスト情報を付与する",
                details: `動画IDならタイトルが、ユーザーIDならユーザー名がコメントとして付与されます。
                コンテキストメニューからNG登録した場合は付与されません。`,
            },
        ],
    },
    filter: [
        {
            id: "ngId",
            name: "NGユーザーID/動画ID",
        },
        {
            id: "ngUserName",
            name: "NGユーザー名(正規表現)",
        },
        {
            id: "ngTitle",
            name: "NGタイトル(正規表現)",
        },
    ],
} as const satisfies {
    checkbox: {
        top: CheckboxProps[];
        filtering: CheckboxProps[];
        log: CheckboxProps[];
        notification: CheckboxProps[];
        other: CheckboxProps[];
    };
    filter: VideoFilterAreaProps[];
};

export const expandNicoruSettings = {
    checkbox: {
        top: [
            {
                id: "isExpandNicoruEnabled",
                label: "拡張ニコるを有効にする",
            },
        ],
        style: [
            {
                id: "isCommentBodyHighlighted",
                label: "装飾対象のコメントの本文を強調する",
            },
        ],
    },
} as const satisfies {
    checkbox: {
        top: CheckboxProps[];
        style: CheckboxProps[];
    };
};

export const popupConfig = {
    tab: [
        {
            id: "commentFilter",
            name: "コメントフィルター",
        },
        {
            id: "videoFilter",
            name: "動画フィルター",
        },
    ],
    commentFilter: {
        log: [
            {
                id: "easyComment",
                name: "かんたんコメント",
            },
            {
                id: "ngUserId",
                name: "NGユーザーID",
            },
            {
                id: "ngScore",
                name: "NGスコア",
            },
            {
                id: "ngCommand",
                name: "NGコマンド",
            },
            {
                id: "ngWord",
                name: "NGワード",
            },
        ],
    },
    videoFilter: {
        log: [
            {
                id: "ngId",
                name: "NGユーザーID/動画ID",
            },
            {
                id: "paid",
                name: "有料動画",
            },
            {
                id: "views",
                name: "再生回数",
            },
            {
                id: "ngUserName",
                name: "NGユーザー名",
            },
            {
                id: "ngTitle",
                name: "NGタイトル",
            },
        ],
    },
} as const satisfies {
    tab: {
        id: FilterTab;
        name: string;
    }[];
    commentFilter: {
        log: CommentLogViewerProps[];
    };
    videoFilter: {
        log: VideoLogViewerProps[];
    };
};

export const quickEditConfig = {
    tab: [
        {
            id: "commentFilter",
            name: "コメントフィルター",
        },
        {
            id: "videoFilter",
            name: "動画フィルター",
        },
    ],
} as const satisfies {
    tab: {
        id: FilterTab;
        name: string;
    }[];
};
