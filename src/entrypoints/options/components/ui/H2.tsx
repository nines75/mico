import { Info } from "lucide-react";

interface H2Props {
  name: string | undefined;
  url?: string | undefined;
  children: React.ReactNode;
}

export default function H2({ name, url, children }: H2Props) {
  return name === undefined ? (
    children
  ) : (
    <section>
      <div className="icon-container">
        <h2>{name}</h2>
        {url !== undefined && (
          <a className="anchor-reset" href={url} target="_blank">
            <Info size={20} />
          </a>
        )}
      </div>
      <div className="settings-container">{children}</div>
    </section>
  );
}
