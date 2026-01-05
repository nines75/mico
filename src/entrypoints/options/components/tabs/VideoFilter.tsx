import type { CheckboxGroups } from "../ui/CheckboxSection.js";
import CheckboxSection from "../ui/CheckboxSection.js";
import VideoFilterArea from "../ui/VideoFilterArea.js";

export default function VideoFilter() {
    return (
        <div className="settings-container">
            <CheckboxSection groups={config}>
                <VideoFilterArea />
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
] satisfies CheckboxGroups;
