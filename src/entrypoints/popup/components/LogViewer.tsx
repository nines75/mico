import { JSX } from "react";

interface BlockProps {
    element: JSX.Element | string;
    children: React.ReactNode;
}

export function Block({ element, children }: BlockProps) {
    return (
        <>
            <Comment>{element}</Comment>
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
