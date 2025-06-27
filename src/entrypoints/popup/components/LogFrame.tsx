import { InfoContent } from "./Info.js";

interface LogFrameProps {
    name: string;
    rule: number | undefined;
    blocked: number;
    children: React.ReactNode;
}

export function LogFrame({ name, rule, blocked, children }: LogFrameProps) {
    return (
        <section>
            <div className="filtering-type">{name}</div>
            <div>
                {rule !== undefined && (
                    <InfoContent name="ルール数:" value={rule} />
                )}
                <InfoContent name="ブロック数:" value={blocked} />
            </div>
            {children}
        </section>
    );
}
