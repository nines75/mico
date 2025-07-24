import { CommentLogViewerProps } from "@/entrypoints/popup/components/CommentLogViewer.js";
import {
    PopupTab,
    Settings,
    SettingsTab,
} from "../types/storage/settings.types.js";
import { CheckboxProps } from "@/entrypoints/options/components/ui/Checkbox.js";
import { CommentFilterAreaProps } from "@/entrypoints/options/components/ui/CommentFilterArea.js";
import { VideoFilterAreaProps } from "@/entrypoints/options/components/ui/VideoFilterArea.js";
import { VideoLogViewerProps } from "@/entrypoints/popup/components/VideoLogViewer.js";

export const defaultSettings: Settings = {
    // コメントフィルター

    isCommentFilterEnabled: true,

    /// フィルタリング
    isCaseInsensitive: true,
    isHideEasyComment: false,
    isIgnoreByNicoru: false,
    IgnoreByNicoruCount: 30,
    isScoreFilterEnabled: false,
    scoreFilterCount: -4800,
    isVimKeybindingsEnabled: false,
    selectedCommentFilter: "ngUserId",
    ngUserId: "",
    ngCommand: "",
    ngWord: "",

    /// ログ
    isShowNgScoreInLog: true,
    isShowNicoruInLog: true,
    showNicoruInLogCount: 30,
    isShowDuplicateInLog: true,
    showDuplicateInLogCount: 2,

    /// 通知
    isNotifyAddNgUserId: true,
    isNotifyAutoAddNgUserId: true,

    /// その他
    isAutoReload: false,
    isPartialBadgeCount: false,
    isShowUserIdInDropdown: true,

    // 動画フィルター

    isVideoFilterEnabled: true,
    isAddNgContext: false,

    /// フィルタリング
    selectedVideoFilter: "ngId",
    ngId: "",
    ngTitle: "",
    ngUserName: "",

    // 拡張ニコる
    isExpandNicoruEnabled: false,
    nicoruCounts: [300, 200, 100, 50, 30, 15], // 降順である必要がある
    nicoruColors: {
        // 明示的に設定しないとリセット時に前の値を上書きできない
        "15": {
            primary: "#fcc442",
            secondary: "",
            isGradate: false,
        },
        "30": {
            primary: "#fcb242",
            secondary: "",
            isGradate: false,
        },
        "50": {
            primary: "#fc9f42",
            secondary: "",
            isGradate: false,
        },
        "100": {
            primary: "#ffee9d",
            secondary: "#d9a300",
            isGradate: true,
        },
        "200": {
            primary: "#ff8080",
            secondary: "#ff0000",
            isGradate: true,
        },
        "300": {
            primary: "#ff00ff",
            secondary: "#ff0080",
            isGradate: true,
        },
    },

    // 設定

    /// タブ
    settingsSelectedTab: "general",

    // ポップアップ

    /// 開閉設定
    isOpenProcessingTime: false,
    isOpenCount: true,
    isOpenVideoLog: true,

    /// タブ
    popupSelectedTab: "commentFilter",
} as const;

export const attributes = {
    decorationVideoId: "data-decoration-video-id",
} as const;

export const buttons = {
    AddNgUserId: "ユーザーをNG登録({target})",
    AddSpecificNgUserId: "この動画だけユーザーをNG登録({target})",
} as const;

export const messages = {
    ngUserId: {
        // 追加
        additionSuccess: "ユーザーのNG登録に成功しました",
        additionFailed: "ユーザーのNG登録に失敗しました",
        notifyAddition: "{target}件のユーザーIDがNGリストに追加されました",
        confirmAddition: "以下のユーザーIDをNG登録しますか？\n\n{target}",
        confirmAdditionByVideo: "この動画を投稿したユーザーをNG登録しますか？",

        // 削除
        confirmRemoval: "以下のNGユーザーIDを削除しますか？\n\n{target}",

        undoStrict:
            "strictルールによって自動追加されたNGユーザーIDを削除します。\n以下のNGユーザーIDを削除しますか？\n\n{target}",
        alreadyAdded: "このユーザーIDは既にNG登録されています",
    },
    ngVideoId: {
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

        // toggle
        commentFilterDisabled: "コメントフィルターが無効になっています",
        videoFilterDisabled: "動画フィルターが無効になっています",
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

    undoStrict: "strictルールによって自動追加されたNGユーザーIDを削除します",
} as const;

export const colors = {
    commentBadge: "#b22222",
    videoBadge: "#00ffff",
} as const;

export const urls = {
    repository: "https://github.com/nines75/mico",
} as const;

export const pattern = {
    topPageUrlGlob: "https://www.nicovideo.jp/*",
    watchPageUrl: "https://www.nicovideo.jp/watch/",
    watchPageUrlGlob: "https://www.nicovideo.jp/watch/*",
    rankingPageUrl: "https://www.nicovideo.jp/ranking/genre",
    searchPageUrl: "https://www.nicovideo.jp/search/",
    tagSearchPageUrl: "https://www.nicovideo.jp/tag/",
    regex: {
        checkRawUserId: /^(?:ch)?\d+$/,
        checkVideoId: /^(?:sm|so|nl|nm)\d+$/,
        extractCommentNo: /(\d+)$/,
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
            id: "backup",
            name: "バックアップ",
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
        filter: [
            {
                id: "isCaseInsensitive",
                label: "大小文字を区別しない",
                details:
                    "正規表現が使用可能なフィルターに対してのみ有効になります。",
            },
            {
                id: "isVimKeybindingsEnabled",
                label: "Vimのキーバインドを有効にする",
            },
        ],
    },
} as const satisfies {
    checkbox: {
        filter: CheckboxProps[];
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
                id: "isHideEasyComment",
                label: "かんたんコメントを非表示にする",
            },
            {
                id: "isScoreFilterEnabled",
                label: "NGスコアによるフィルタリングを有効にする",
                details: `NGスコアの最大値は0で、低いほど悪くなります。
                公式の共有NG機能でのNGスコアの基準値は弱で-10000以下、中で-4800以下、強で-1000以下です。`,
                input: {
                    id: "scoreFilterCount",
                    label: "以下のNGスコアだった場合にフィルタリング",
                    max: 0,
                },
            },
            {
                id: "isIgnoreByNicoru",
                label: "ニコるの数に応じてフィルタ適用の対象外にする",
                details: "かんたんコメントの非表示には影響しません。",
                input: {
                    id: "IgnoreByNicoruCount",
                    label: "回以上ニコられていた場合に除外",
                    min: 0,
                },
            },
        ],
        log: [
            {
                id: "isShowNgScoreInLog",
                label: "NGスコアを表示する",
                details: "🚫マークの横に表示されているのがNGスコアです。",
            },
            {
                id: "isShowNicoruInLog",
                label: "ニコるの数を表示する",
                details: "👍マークの横に表示されているのがニコるの数です。",
                input: {
                    id: "showNicoruInLogCount",
                    label: "回以上ニコられていた場合に表示",
                    min: 0,
                },
            },
            {
                id: "isShowDuplicateInLog",
                label: "重複したコメントの数を表示する",
                input: {
                    id: "showDuplicateInLogCount",
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
                id: "isPartialBadgeCount",
                label: "バッジに表示する値をログの数に変更する",
                details: `デフォルトでは総ブロック数が表示されますが、その値からログを保存しないコメントの数を引いた値が表示されます。`,
            },
            {
                id: "isShowUserIdInDropdown",
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
            {
                id: "isAddNgContext",
                label: "NG追加時にコンテキスト情報を付与する",
                details: `動画IDならタイトルが、ユーザーIDならユーザー名がコメントとして付与されます。
                フィルターのサイズが大きくなる可能性があります。`,
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
    };
    filter: VideoFilterAreaProps[];
};

export const expandNicoruSettings = {
    checkbox: [
        {
            id: "isExpandNicoruEnabled",
            label: "拡張ニコるを有効にする",
        },
    ],
} as const satisfies {
    checkbox: CheckboxProps[];
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
        id: PopupTab;
        name: string;
    }[];
    commentFilter: {
        log: CommentLogViewerProps[];
    };
    videoFilter: {
        log: VideoLogViewerProps[];
    };
};
