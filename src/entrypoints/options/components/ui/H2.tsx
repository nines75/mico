interface H2Props {
  name: string | undefined;
  children: React.ReactNode;
}

export default function H2({ name, children }: H2Props) {
  return name === undefined ? (
    children
  ) : (
    <section>
      <h2>{name}</h2>
      <div className="settings-container">{children}</div>
    </section>
  );
}
