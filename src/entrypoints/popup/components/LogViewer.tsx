export function Line({ children }: { children: React.ReactNode }) {
    return <div className="log-line">{children}</div>;
}

export function Comment({ children }: { children: React.ReactNode }) {
    return <div className="log-line comment">{children}</div>;
}
