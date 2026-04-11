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
        isChildren: true,
        items: [
            {
                id: "isVideoFilterEnabled",
                label: "動画フィルターを有効にする",
            },
        ],
    },
    {
        heading: "フィルタリング",
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
        heading: "ログ",
        items: [
            {
                id: "isTitleRenderedAsLink",
                label: "動画タイトルをリンクとして表示する",
                details:
                    "動画タイトルをクリックしてNG登録や削除することは出来なくなります。",
            },
        ],
    },
    {
        heading: "通知",
        items: [
            {
                id: "isNotifyAddNgId",
                label: "NG登録時に通知する",
                details:
                    "コンテキストメニューやクリップボードからNG登録した際に通知されます。",
            },
        ],
    },
] satisfies CheckboxGroups;
