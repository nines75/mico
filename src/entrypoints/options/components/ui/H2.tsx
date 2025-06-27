interface H2props {
    name: string;
    children: React.ReactNode;
}

export default function H2({ name, children }: H2props) {
    return (
        <section>
            <div className="header-container">
                <h2>{name}</h2>
            </div>
            <div className="settings-container">{children}</div>
        </section>
    );
}
