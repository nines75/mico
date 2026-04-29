import type { CheckboxGroups } from "../ui/CheckboxSection";
import CheckboxSection from "../ui/CheckboxSection";

export default function VideoFilter() {
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
        id: "enableVideoFilter",
        label: "動画フィルターを有効にする",
      },
    ],
  },
  {
    heading: "フィルタリング",
    items: [
      {
        id: "hideCommentPreview",
        label: "コメントプレビューを非表示にする",
      },
      {
        id: "enablePaidFilter",
        label: "有料動画を非表示にする",
      },
      {
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
] satisfies CheckboxGroups;
