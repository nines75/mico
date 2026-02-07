interface H2Props {
    name: string | undefined;
    children: React.ReactNode;
}

export default function H2({ name, children }: H2Props) {
    return name === undefined ? (
        children
    ) : (
        <section>
            <div className="heading-container">
                <h2>{name}</h2>
            </div>
            <div className="settings-container">{children}</div>
        </section>
    );
}
