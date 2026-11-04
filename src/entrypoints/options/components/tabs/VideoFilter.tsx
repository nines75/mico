import type { SectionsItem } from "../ui/Sections";
import Sections from "../ui/Sections";

export default function VideoFilter() {
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
        id: "enableVideoFilter",
        label: "動画フィルターを有効にする",
      },
    ],
  },
  {
    heading: "フィルタリング",
    items: [
      {
        type: "checkbox",
        id: "enablePaidFilter",
        label: "有料動画を非表示にする",
      },
      {
        type: "checkbox",
        id: "enableShortsFilter",
        label: "ショート動画を非表示にする",
        details: "対象となるのは視聴ページのレコメンドのみです。",
      },
      {
        type: "checkbox",
        id: "hideCommentPreview",
        label: "コメントプレビューを非表示にする",
        url: "https://github.com/nines75/mico/wiki/用語集#コメントプレビュー",
      },
      {
        type: "checkbox",
        id: "enableSeriesNextFilter",
        label: "次のシリーズ動画のフィルタリングを有効にする",
        details:
          "レコメンド最上部に表示される、次のシリーズ動画をフィルタリング対象にします。",
      },
      {
        type: "checkbox",
        id: "enableViewCountFilter",
        label: "再生回数によるフィルタリングを有効にする",
        details: "対象となるのは視聴ページのレコメンドのみです。",
        input: {
          id: "viewCountFilterThreshold",
          label: "再生以下だった場合にフィルタリング",
          min: 0,
        },
      },
    ],
  },
] satisfies SectionsItem;
