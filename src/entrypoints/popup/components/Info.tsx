interface InfoProps {
    name: string;
    value: string | number;
}

export function Info({ name, value }: InfoProps) {
    return (
        <section>
            <span className="info">
                <span>{name}</span>
                <span className="value">{value}</span>
            </span>
        </section>
    );
}
