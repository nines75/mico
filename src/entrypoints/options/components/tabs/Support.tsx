import {
  BookText,
  CircleQuestionMark,
  GitBranch,
  History,
  Mail,
  MessageSquare,
  Scale,
} from "lucide-react";
import H2 from "../ui/H2";

const ICON_SIZE = 18;

export default function Support() {
  return (
    <div className="tab-content">
      {config.map(({ heading, items }) => (
        <H2 key={heading} name={heading}>
          {items.map(({ name, url, icon }) => (
            <a
              key={name}
              className="button button-support"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              {icon}
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
      {
        name: "リポジトリ",
        url: "https://github.com/nines75/mico",
        icon: <GitBranch size={ICON_SIZE} />,
      },
      {
        name: "変更履歴",
        url: "https://github.com/nines75/mico/releases",
        icon: <History size={ICON_SIZE} />,
      },
      {
        name: "wiki",
        url: "https://github.com/nines75/mico/wiki",
        icon: <BookText size={ICON_SIZE} />,
      },
    ],
  },
  {
    heading: "コンタクト",
    items: [
      {
        name: "要望・バグ報告",
        url: "https://github.com/nines75/mico/issues",
        icon: <MessageSquare size={ICON_SIZE} />,
      },
      {
        name: "質問",
        url: "https://github.com/nines75/mico/discussions",
        icon: <CircleQuestionMark size={ICON_SIZE} />,
      },
      {
        name: "メール",
        url: "mailto:mico.counting258@simplelogin.com",
        icon: <Mail size={ICON_SIZE} />,
      },
    ],
  },
  {
    heading: "その他",
    items: [
      {
        name: "サードパーティライセンス",
        url: "/third-party-notices.txt",
        icon: <Scale size={ICON_SIZE} />,
      },
    ],
  },
] satisfies {
  heading: string;
  items: {
    name: string;
    url: string;
    icon: React.ReactNode;
  }[];
}[];
