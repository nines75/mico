import CommentFilterArea from "../ui/CommentFilterArea";
import type { CheckboxGroups } from "../ui/CheckboxSection";
import CheckboxSection from "../ui/CheckboxSection";

export default function CommentFilter() {
    return (
        <div className="settings-container">
            <CheckboxSection groups={config}>
                <CommentFilterArea />
            </CheckboxSection>
        </div>
    );
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

const config = [
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
] satisfies CheckboxGroups;
