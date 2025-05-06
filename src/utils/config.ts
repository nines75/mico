import { LogViewerProps } from "@/entrypoints/popup/components/LogViewer.js";
import { Settings } from "../types/storage/settings.types.js";
import { CheckboxProps } from "@/entrypoints/options/components/ui/Checkbox.js";
import { FilterAreaProps } from "@/entrypoints/options/components/ui/FilterArea.js";

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
    isUseVimKeybindings: false,
    ngUserId: "",
    ngCommand: "",
    ngWord: "",

    /// ログ
    isSaveFilteringLog: true,
    isShowNgScoreInLog: true,
    isShowNicoruInLog: false,
    showNicoruInLogCount: 30,
    isShowDuplicateInLog: true,
    showDuplicateInLogCount: 2,

    /// 通知
    isNotifyStrictRule: true,
    isNotifyAddNgUserId: true,

    /// その他
    isAutoReload: true,
    isPartialBadgeCount: false,

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

    // 設定の開閉設定
    isOpenNgUserIdFilter: false,
    isOpenNgCommandFilter: false,
    isOpenNgWordFilter: false,
    isOpenCustomColor: false,

    // ポップアップの開閉設定
    isOpenProcessingTime: false,
    isOpenCount: true,
    isOpenVideoLog: true,
} as const;

export const selectors = {
    commentText: ":scope > div > div > p",
    commentNicoru: ":scope > div > button > p",
    commentTime: ":scope > div > div > p > span",
    player: "div[class='grid-area_[player]'] > div > div > div > div",
    dropdownButtonsParent: ":scope > div > div:last-of-type",
    dropdownButtonSample: ":scope > button",
    dropdownCommentNo: ":scope > div > div:nth-child(2) > p:last-of-type",
} as const;

export const texts = {
    background: {
        errorMessageGetTags: "タグの取得に失敗しました",
        messageFailedToAddNgUserId: "ユーザーのNG登録に失敗しました",
    },
    content: {
        textAddNgUserIdButton: "ユーザーをNG登録({target})",
        textAddSpecificNgUserIdButton: "この動画だけユーザーをNG登録({target})",
        messageAddNgUserId: "ユーザーのNG登録に成功しました",
        messageNotifyAddNgUserId:
            "{target}件のユーザーIDがNGリストに追加されました",
    },
    settings: {
        messagePopHeadRule:
            "空行やコメント行を除いた先頭のルールを削除します。\n以下のルールを削除しますか？\n\n{target}",
        messageNeverReset: "設定が一度も変更されていません",
        messageReset:
            "ストレージに保存されている全てのデータを削除します。\nこの操作により、この拡張機能の設定やログがリセットされます。\n続行しますか？",
        messageNumberTooBig: "入力された数値が大きすぎます",
        messageValueAlreadyExists: "すでに存在する値です",
        messageResetNicoruCounts:
            "拡張ニコるの基準値や配色の設定がリセットされます。\n続行しますか？",
    },
    popup: {
        messageNotWork: "このページでは動作しません",
        messageCommentFilterDisabled: "コメントフィルターが無効になっています",
        messageFilteringLogDisabled:
            "フィルタリングログを保存しない設定になっています",
        titleUndoStrictNgUserIds:
            "strictルールによって自動追加されたNGユーザーIDを削除します",
        messageUndoStrictNgUserIds:
            "strictルールによって自動追加されたNGユーザーIDを削除します。\n以下のNGユーザーIDを削除しますか？\n\n{target}",
        titleRemoveNgUserId: "クリックしてNGユーザーIDを削除",
        messageRemoveNgUserId: "以下のNGユーザーIDを削除しますか？\n\n{target}",
        titleAddNgUserId: "クリックしてこのコメントを投稿したユーザーをNG登録",
        messageAddNgUserId: "以下のユーザーIDをNG登録しますか？\n\n{target}",
        messageNgUserIdAlreadyExists: "このユーザーIDは既にNG登録されています",
    },
} as const;

export const colors = {
    badge: "#b22222",
} as const;

export const urls = {
    repository: "https://github.com/nines75/mico",
} as const;

export const pattern = {
    topPageUrlGlob: "https://www.nicovideo.jp/*",
    watchPageUrl: "https://www.nicovideo.jp/watch/",
    watchPageUrlGlob: "https://www.nicovideo.jp/watch/*",
    regex: {
        extractVideoId: /(sm|so|nl|nm)\d+/,
        extractCommentNo: /(\d+)$/,
    },
} as const;

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
                id: "isCaseInsensitive",
                label: "正規表現で英字の大文字小文字を区別しない",
            },
            {
                id: "isHideEasyComment",
                label: "かんたんコメントを非表示にする",
                details:
                    "この設定はニコるの数に応じてフィルタ適用の対象外にする設定より優先されます。",
            },
            {
                id: "isIgnoreByNicoru",
                label: "ニコるの数に応じてフィルタ適用の対象外にする",
                input: {
                    id: "IgnoreByNicoruCount",
                    label: "回以上ニコられていた場合に除外",
                    min: 0,
                },
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
        ],
        log: [
            {
                id: "isSaveFilteringLog",
                label: "フィルタリングログを保存する",
                details:
                    "有効になっている場合でもフィルタリングログはブラウザを起動するたびに削除されます。",
            },
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
                id: "isNotifyStrictRule",
                label: "strictルールによってユーザーIDがフィルターに追加されたときに通知を送信する",
            },
            {
                id: "isNotifyAddNgUserId",
                label: "ドロップダウンのユーザーNGボタンからユーザーIDをフィルターに追加したときに通知を送信する",
            },
        ],
        other: [
            {
                id: "isAutoReload",
                label: "ドロップダウンのユーザーNGボタンを押した際に自動でリロードする",
                details:
                    "読み込み後、リロードする前の再生時間が自動で再設定されます。",
            },
            {
                id: "isPartialBadgeCount",
                label: "バッジに表示する総ブロック数にかんたんコメントのブロック数を加算しない",
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
    filter: FilterAreaProps[];
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
} as const satisfies {
    log: LogViewerProps[];
};
