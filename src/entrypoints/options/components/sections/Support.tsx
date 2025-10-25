import { urls } from "@/utils/config.js";
import H2 from "../ui/H2.js";

export default function Support() {
    return (
        <div className="settings-container">
            {(
                [
                    [
                        "リンク",
                        [
                            ["リポジトリ", urls.repository],
                            ["変更履歴", urls.changeLog],
                            ["wiki", urls.wiki],
                        ],
                    ],
                    [
                        "コンタクト",
                        [
                            ["要望/バグ報告", urls.issues],
                            ["質問", urls.discussions],
                            ["メール", "mailto:zs4vbe5l3@mozmail.com"],
                        ],
                    ],
                    [
                        "その他",
                        [
                            [
                                "サードパーティライセンス",
                                "/third-party-notices.txt",
                            ],
                        ],
                    ],
                ] as const
            ).map(([header, links]) => (
                <H2 key={header} name={header}>
                    {links.map(([name, url]) => (
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
