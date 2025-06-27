interface H3props {
    name: string;
    children: React.ReactNode;
}

export default function H3({ name, children }: H3props) {
    return (
        <section>
            <div className="header-container">
                <h3>{name}</h3>
            </div>
            <div className="settings-container">{children}</div>
        </section>
    );
}
