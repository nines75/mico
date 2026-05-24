import type { AutoRule } from "@/entrypoints/background/rule";
import { useSettingsStore } from "@/utils/store";
import decamelize from "decamelize";
import { X } from "lucide-react";
import { useShallow } from "zustand/shallow";
import type { VListHandle } from "virtua";
import { VList } from "virtua";
import { escapeNewline } from "@/utils/util";
import { useEffect, useMemo, useRef, useState } from "react";

export default function AutoFilter() {
  const ref = useRef<VListHandle>(null);
  const [query, setQuery] = useState("");
  const autoFilter = useSettingsStore((state) => state.settings.autoFilter);

  const rules = useMemo(
    () =>
      autoFilter.filter((rule) => {
        if (query === "") return true;

        return (
          rule.pattern?.includes(query) === true ||
          rule.source?.includes(query) === true ||
          rule.context?.includes(query) === true ||
          rule.memo?.includes(query) === true ||
          rule.include?.videoIds?.flat().some((id) => id.includes(query)) ===
            true ||
          (rule.target !== undefined &&
            Object.entries(rule.target).some(([key, value]) => {
              if (!value) return false;

              return decamelize(key, { separator: "-" }).includes(query);
            }))
        );
      }),
    [autoFilter, query],
  );

  useEffect(() => {
    const handle = ref.current;
    if (handle === null) return;

    // ブラウザによって復元されたスクロール位置をリセット
    handle.scrollTo(0);
  }, []);

  return (
    <>
      <input
        className="search"
        placeholder="ルールを検索"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
      />
      <VList className="rule-container" ref={ref}>
        {rules.map((rule) => {
          if (rule.id === undefined) return null;

          return <Rule rule={rule} key={rule.id} />;
        })}
      </VList>
    </>
  );
}

interface RuleProps {
  rule: Partial<AutoRule>;
}

function Rule({ rule }: RuleProps) {
  const [autoFilter, save] = useSettingsStore(
    useShallow((state) => [state.settings.autoFilter, state.saveSettings]),
  );

  const pattern = rule.pattern;
  if (pattern === undefined) return null;

  return (
    <div className="rule">
      <div className="rule-pattern">
        <button
          className="rule-remove-button"
          title="ルールを削除"
          onClick={() => {
            save({
              autoFilter: autoFilter.filter(({ id }) => id !== rule.id),
            });
          }}
        >
          <X size={30} />
        </button>
        {pattern}
      </div>
      <div className="rule-details">
        {rule.target !== undefined &&
          Object.entries(rule.target).map(([key, value]) => {
            if (!value) return null;

            return (
              <Detail name="ターゲット" key={key}>
                {decamelize(key, {
                  separator: "-",
                })}
              </Detail>
            );
          })}
        {rule.include?.videoIds !== undefined && (
          <Detail name="include-video-ids">{rule.include.videoIds}</Detail>
        )}
        {rule.source !== undefined && (
          <Detail name="ソース">{rule.source}</Detail>
        )}
        {rule.context !== undefined && (
          <Detail name="コンテキスト">{escapeNewline(rule.context)}</Detail>
        )}
        {rule.memo !== undefined && <Detail name="メモ">{rule.memo}</Detail>}
      </div>
    </div>
  );
}

interface DetailProps {
  name: string;
  children: React.ReactNode;
}

function Detail({ name, children }: DetailProps) {
  return (
    <span>
      {name}
      <span className="rule-details-value">{children}</span>
    </span>
  );
}
