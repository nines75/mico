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
        id: "hideCommentPreview",
        label: "コメントプレビューを非表示にする",
      },
      {
        type: "checkbox",
        id: "enablePaidFilter",
        label: "有料動画を非表示にする",
      },
      {
        type: "checkbox",
        id: "enableShortsFilter",
        label: "ショート動画を非表示にする",
        details: "対象となるのは視聴ページの関連動画のみです。",
      },
      {
        type: "checkbox",
        id: "enableViewCountFilter",
        label: "再生回数によるフィルタリングを有効にする",
        details: "対象となるのは視聴ページの関連動画のみです。",
        input: {
          id: "viewCountFilterThreshold",
          label: "再生以下だった場合にフィルタリング",
          min: 0,
        },
      },
    ],
  },
] satisfies SectionsItem;
