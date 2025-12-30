import type { CommentLogViewerProps } from "@/entrypoints/popup/components/CommentLogViewer.js";
import type {
    FilterTab,
    Settings,
    SettingsTab,
} from "../types/storage/settings.types.js";
import type { CheckboxProps } from "@/entrypoints/options/components/ui/Checkbox.js";
import type { CommentFilterAreaProps } from "@/entrypoints/options/components/ui/CommentFilterArea.js";
import type { VideoFilterAreaProps } from "@/entrypoints/options/components/ui/VideoFilterArea.js";
import type { VideoLogViewerProps } from "@/entrypoints/popup/components/VideoLogViewer.js";
import type { CheckboxGroups } from "@/entrypoints/options/components/ui/CheckboxSection.js";

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
    checkbox: [
        {
            header: "エディター",
            items: [
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
        },
        {
            header: "クイック編集",
            items: [
                {
                    id: "isConfirmCloseQuickEdit",
                    label: "閉じる前に確認ダイアログを表示する",
                },
            ],
        },
        {
            header: "高度な機能",
            isChildren: true,
            items: [
                {
                    id: "isAdvancedFeaturesVisible",
                    label: "高度な機能を表示する",
                },
            ],
        },
    ],
    advanced: [
        {
            id: "isImeDisabledByContext",
            label: "コンテキストに応じてIMEを無効化する",
            details: `Vimモードでのみ有効となり、ノーマルモードに戻った際やエディターにフォーカスした際にIMEが無効化されます。
            ネイティブメッセージング権限とバイナリのインストールが必要です。`,
        },
    ],
} as const satisfies {
    checkbox: CheckboxGroups;
    advanced: CheckboxProps[];
};

export const commentFilterSettings = {
    checkbox: [
        {
            items: [
                {
                    id: "isCommentFilterEnabled",
                    label: "コメントフィルターを有効にする",
                },
            ],
        },
        {
            header: "フィルタリング",
            isChildren: true,
            items: [
                {
                    id: "isEasyCommentHidden",
                    label: "かんたんコメントを非表示にする",
                },
                {
                    id: "isCommentAssistFilterEnabled",
                    label: "コメントアシストによって投稿されたコメントを非表示にする",
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
                    id: "isMyCommentIgnored",
                    label: "自分が投稿したコメントをフィルタリングの対象外にする",
                },
                {
                    id: "isIgnoreByNicoru",
                    label: "ニコるの数に応じてフィルタリングの対象外にする",
                    input: {
                        id: "ignoreByNicoruCount",
                        label: "回以上ニコられていた場合に除外",
                        min: 0,
                    },
                },
            ],
        },
        {
            header: "ログ",
            items: [
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
        },
        {
            header: "通知",
            items: [
                {
                    id: "isNotifyAddNgUserId",
                    label: "NGユーザーIDの手動登録時に通知する",
                },
                {
                    id: "isNotifyAutoAddNgUserId",
                    label: "NGユーザーIDの自動登録時に通知する",
                },
            ],
        },
        {
            header: "ドロップダウン",
            items: [
                {
                    id: "isUserIdMountedToDropdown",
                    label: "ユーザーIDを表示する",
                },
                {
                    id: "isNgScoreMountedToDropdown",
                    label: "NGスコアを表示する",
                },
                {
                    id: "isAutoReload",
                    label: "自動リロードを有効にする",
                    details: `ドロップダウンのユーザーNGボタンを押した際に自動でリロードします。
                    読み込み後、リロードする前の再生時間が自動で再設定されます。`,
                },
            ],
        },
        {
            header: "その他",
            items: [
                {
                    id: "isCommentNgContextAppended",
                    label: "NG登録時にコンテキスト情報を付与する",
                },
            ],
        },
    ],
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
            name: "NGワード",
        },
    ],
} as const satisfies {
    checkbox: CheckboxGroups;
    filter: CommentFilterAreaProps[];
};

export const videoFilterSettings = {
    checkbox: [
        {
            items: [
                {
                    id: "isVideoFilterEnabled",
                    label: "動画フィルターを有効にする",
                },
            ],
        },
        {
            header: "フィルタリング",
            isChildren: true,
            items: [
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
        },
        {
            header: "ログ",
            items: [
                {
                    id: "isTitleRenderedAsLink",
                    label: "動画タイトルをリンクとして表示する",
                    details:
                        "動画タイトルをクリックしてNG登録/解除することは出来なくなります。",
                },
            ],
        },
        {
            header: "通知",
            items: [
                {
                    id: "isNotifyAddNgId",
                    label: "NG登録時に通知する",
                    details:
                        "コンテキストメニューやクリップボードからNG登録した際に通知されます。",
                },
            ],
        },
        {
            header: "その他",
            items: [
                {
                    id: "isNgContextAppendedOnAdd",
                    label: "NG登録時にコンテキスト情報を付与する",
                    details:
                        "コンテキストメニューからNG登録した場合は付与されません。",
                },
            ],
        },
    ],
    filter: [
        {
            id: "ngId",
            name: "NGユーザーID/動画ID",
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
} as const satisfies {
    checkbox: CheckboxGroups;
    filter: VideoFilterAreaProps[];
};

export const expandNicoruSettings = {
    checkbox: [
        {
            items: [
                {
                    id: "isExpandNicoruEnabled",
                    label: "拡張ニコるを有効にする",
                },
            ],
        },
        {
            header: "スタイル",
            isChildren: true,
            items: [
                {
                    id: "isCommentBodyHighlighted",
                    label: "装飾対象のコメントの本文を強調する",
                },
            ],
        },
    ],
} as const satisfies {
    checkbox: CheckboxGroups;
};

export const supportSettings = {
    links: [
        {
            header: "リンク",
            items: [
                { name: "リポジトリ", url: urls.repository },
                { name: "変更履歴", url: urls.changeLog },
                { name: "wiki", url: urls.wiki },
            ],
        },
        {
            header: "コンタクト",
            items: [
                { name: "要望/バグ報告", url: urls.issues },
                { name: "質問", url: urls.discussions },
                {
                    name: "メール",
                    url: "mailto:mico.counting258@simplelogin.com",
                },
            ],
        },
        {
            header: "その他",
            items: [
                {
                    name: "サードパーティライセンス",
                    url: "/third-party-notices.txt",
                },
            ],
        },
    ],
} as const satisfies {
    links: {
        header: string;
        items: {
            name: string;
            url: string;
        }[];
    }[];
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
                id: "userIdFilter",
                name: "NGユーザーID",
            },
            {
                id: "easyCommentFilter",
                name: "かんたんコメント",
            },
            {
                id: "commentAssistFilter",
                name: "コメントアシスト",
            },
            {
                id: "scoreFilter",
                name: "NGスコア",
            },
            {
                id: "commandFilter",
                name: "NGコマンド",
            },
            {
                id: "wordFilter",
                name: "NGワード",
            },
        ],
    },
    videoFilter: {
        log: [
            {
                id: "idFilter",
                name: "NGユーザーID/動画ID",
            },
            {
                id: "paidFilter",
                name: "有料動画",
            },
            {
                id: "viewsFilter",
                name: "再生回数",
            },
            {
                id: "userNameFilter",
                name: "NGユーザー名",
            },
            {
                id: "titleFilter",
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
