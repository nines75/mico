import { urls } from "@/utils/config.js";
import H2 from "../ui/H2.js";

export default function Support() {
    return (
        <div className="settings-container">
            {config.map(({ header, items }) => (
                <H2 key={header} name={header}>
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
        header: "リンク",
        items: [
            { name: "リポジトリ", url: urls.repository },
            { name: "変更履歴", url: urls.changeLog },
            { name: "wiki", url: urls.wiki },
        ],
    },
    {
        header: "コンタクト",
        items: [
            { name: "要望/バグ報告", url: urls.issues },
            { name: "質問", url: urls.discussions },
            {
                name: "メール",
                url: "mailto:mico.counting258@simplelogin.com",
            },
        ],
    },
    {
        header: "その他",
        items: [
            {
                name: "サードパーティライセンス",
                url: "/third-party-notices.txt",
            },
        ],
    },
] satisfies {
    header: string;
    items: {
        name: string;
        url: string;
    }[];
}[];
