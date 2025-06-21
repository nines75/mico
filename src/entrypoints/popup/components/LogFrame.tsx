interface LogFrameProps {
    name: string;
    rule?: number;
    blocked: number;
    children: React.ReactNode;
}

export function LogFrame({ name, rule, blocked, children }: LogFrameProps) {
    return (
        <section>
            <div className="filtering-type">{name}</div>
            <div>
                {rule !== undefined && (
                    <span className="info">
                        <span>ルール数:</span>
                        <span className="value">{rule}</span>
                    </span>
                )}
                <span className="info">
                    <span>ブロック数:</span>
                    <span className="value">{blocked}</span>
                </span>
            </div>
            {children}
        </section>
    );
}
