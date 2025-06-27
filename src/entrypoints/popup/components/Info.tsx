interface InfoProps {
    name: string;
    value: string | number;
}

export function Info({ name, value }: InfoProps) {
    return (
        <section>
            <InfoContent name={name} value={value} />
        </section>
    );
}

export function InfoContent({ name, value }: InfoProps) {
    return (
        <span className="info">
            <span>{name}</span>
            <span className="value">{value}</span>
        </span>
    );
}
