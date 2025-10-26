interface H2props {
    name: string | undefined;
    children: React.ReactNode;
}

export default function H2({ name, children }: H2props) {
    return name === undefined ? (
        children
    ) : (
        <section>
            <div className="header-container">
                <h2>{name}</h2>
            </div>
            <div className="settings-container">{children}</div>
        </section>
    );
}
