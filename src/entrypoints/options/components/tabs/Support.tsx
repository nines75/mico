import H2 from "../ui/H2";

export default function Support() {
  return (
    <div className="tab-content">
      {config.map(({ heading, items }) => (
        <H2 key={heading} name={heading}>
          {items.map(({ name, url }) => (
            <a
              key={name}
              className="button button-support"
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
      { name: "リポジトリ", url: "https://github.com/nines75/mico" },
      { name: "変更履歴", url: "https://github.com/nines75/mico/releases" },
      { name: "wiki", url: "https://github.com/nines75/mico/wiki" },
    ],
  },
  {
    heading: "コンタクト",
    items: [
      { name: "要望・バグ報告", url: "https://github.com/nines75/mico/issues" },
      { name: "質問", url: "https://github.com/nines75/mico/discussions" },
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
