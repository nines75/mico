import { Info } from "lucide-react";

interface H2Props {
  heading: string | undefined;
  url?: string | undefined;
  children: React.ReactNode;
}

export default function H2({ heading, url, children }: H2Props) {
  return heading === undefined ? (
    children
  ) : (
    <section>
      <div className="icon-container">
        <h2>{heading}</h2>
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
