import type { CheckboxGroups } from "../ui/CheckboxSection";
import CheckboxSection from "../ui/CheckboxSection";

export default function CommentFilter() {
    return (
        <div className="tab-content">
            <CheckboxSection groups={config} />
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
                id: "enableCommentFilter",
                label: "コメントフィルターを有効にする",
            },
        ],
    },
    {
        heading: "フィルタリング",
        items: [
            {
                id: "enableEasyCommentFilter",
                label: "かんたんコメントを非表示にする",
            },
            {
                id: "enableCommentAssistFilter",
                label: "コメントアシストによって投稿されたコメントを非表示にする",
            },
            {
                id: "enableScoreFilter",
                label: "NGスコアによるフィルタリングを有効にする",
                input: {
                    id: "scoreFilterThreshold",
                    label: "以下の場合にフィルタリング",
                    max: 0,
                },
            },
            {
                id: "ignoreMyComments",
                label: "自分が投稿したコメントをフィルタリングの対象外にする",
            },
            {
                id: "ignoreByNicoru",
                label: "ニコるの数に応じてフィルタリングの対象外にする",
                input: {
                    id: "ignoreByNicoruThreshold",
                    label: "回以上ニコられていた場合に除外",
                    min: 0,
                },
            },
        ],
    },
    {
        heading: "通知",
        items: [
            {
                id: "notifyOnManualNg",
                label: "手動でNG登録した際に通知する",
            },
            {
                id: "notifyOnAutoNg",
                label: "自動でNG登録した際に通知する",
            },
        ],
    },
    {
        heading: "ドロップダウン",
        items: [
            {
                id: "showUserIdInDropdown",
                label: "ユーザーIDを表示する",
            },
            {
                id: "showScoreInDropdown",
                label: "NGスコアを表示する",
            },
            {
                id: "autoReload",
                label: "自動リロードを有効にする",
                details: `ドロップダウンのユーザーNGボタンを押した際に自動でリロードします。
                    読み込み後、リロードする前の再生時間が自動で再設定されます。`,
            },
        ],
    },
] satisfies CheckboxGroups;
