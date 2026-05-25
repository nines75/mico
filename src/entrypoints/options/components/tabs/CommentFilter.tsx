import type { SectionsItem } from "../ui/Sections";
import Sections from "../ui/Sections";

export default function CommentFilter() {
  return (
    <div className="tab-content">
      <Sections sections={config} />
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
        type: "checkbox",
        id: "enableCommentFilter",
        label: "コメントフィルターを有効にする",
      },
    ],
  },
  {
    heading: "フィルタリング",
    items: [
      {
        type: "checkbox",
        id: "enableEasyCommentFilter",
        label: "かんたんコメントを非表示にする",
      },
      {
        type: "checkbox",
        id: "enableCommentAssistFilter",
        label: "コメントアシストによって投稿されたコメントを非表示にする",
      },
      {
        type: "checkbox",
        id: "enableScoreFilter",
        label: "スコアによるフィルタリングを有効にする",
        input: {
          id: "scoreFilterThreshold",
          label: "以下の場合にフィルタリング",
          max: 0,
        },
      },
      {
        type: "checkbox",
        id: "enableVposFilter",
        label: "動画の長さを超える位置に投稿されたコメントを非表示にする",
      },
      {
        type: "checkbox",
        id: "ignoreMyComments",
        label: "自分が投稿したコメントをフィルタリングの対象外にする",
      },
      {
        type: "checkbox",
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
    heading: "ドロップダウン",
    items: [
      {
        type: "checkbox",
        id: "showUserIdInDropdown",
        label: "ユーザーIDを表示する",
      },
      {
        type: "checkbox",
        id: "showScoreInDropdown",
        label: "スコアを表示する",
      },
      {
        type: "checkbox",
        id: "autoReload",
        label: "自動リロードを有効にする",
        details: `ドロップダウンのユーザーNGボタンを押した際に自動でリロードします。
読み込み後、リロードする前の再生時間が自動で再設定されます。`,
      },
    ],
  },
] satisfies SectionsItem;
