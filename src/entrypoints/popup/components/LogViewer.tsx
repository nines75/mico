import { JSX } from "react";

interface BlockProps {
    comment: JSX.Element | string;
    children: React.ReactNode;
}

export function Block({ comment, children }: BlockProps) {
    return (
        <>
            <Comment>{comment}</Comment>
            {children}
            <br />
        </>
    );
}

export function Line({ children }: { children: React.ReactNode }) {
    return <div className="log-line">{children}</div>;
}

export function Comment({ children }: { children: React.ReactNode }) {
    return <div className="log-line comment">{children}</div>;
}
