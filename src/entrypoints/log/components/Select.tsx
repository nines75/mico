interface SelectProps {
  filter: string | undefined;
  filters: string[];
  setFilter: (filter: string) => void;
  blockedCount: number;
}

export function Select({
  filter,
  filters,
  setFilter,
  blockedCount,
}: SelectProps) {
  if (filter === undefined) return null;

  return (
    <div>
      <select
        className="select-filter"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
        }}
      >
        {filters.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <span className="blocked">ブロック数:{blockedCount}</span>
    </div>
  );
}
