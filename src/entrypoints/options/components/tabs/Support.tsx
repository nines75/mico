import { urls } from "@/utils/config";
import H2 from "../ui/H2";

export default function Support() {
    return (
        <div className="settings-container">
            {config.map(({ heading, items }) => (
                <H2 key={heading} name={heading}>
                    {items.map(({ name, url }) => (
                        <a
                            key={name}
                            className="common-button support-button"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {name}
                        </a>
                    ))}
                </H2>
            ))}
        </div>
    );
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

const config = [
    {
        heading: "リンク",
        items: [
            { name: "リポジトリ", url: urls.repository },
            { name: "変更履歴", url: urls.changeLog },
            { name: "wiki", url: urls.wiki },
        ],
    },
    {
        heading: "コンタクト",
        items: [
            { name: "要望・バグ報告", url: urls.issues },
            { name: "質問", url: urls.discussions },
            {
                name: "メール",
                url: "mailto:mico.counting258@simplelogin.com",
            },
        ],
    },
    {
        heading: "その他",
        items: [
            {
                name: "サードパーティライセンス",
                url: "/third-party-notices.txt",
            },
        ],
    },
] satisfies {
    heading: string;
    items: {
        name: string;
        url: string;
    }[];
}[];
