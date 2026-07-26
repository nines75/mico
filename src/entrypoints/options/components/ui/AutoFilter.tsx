import type { AutoRule } from "@/entrypoints/background/rule";
import { useSettingsStore } from "@/utils/store";
import { BrushCleaning, Pencil, X } from "lucide-react";
import { useShallow } from "zustand/shallow";
import type { VListHandle } from "virtua";
import { VList } from "virtua";
import { decamelize, escapeNewline } from "@/utils/util";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

export default function AutoFilter() {
  const ref = useRef<VListHandle>(null);
  const autoFilter = useSettingsStore((state) => state.settings.autoFilter);

  const [queryString, setQuery] = useState("");
  const queries = queryString.split(/\s+/).filter((value) => value !== "");

  const [position, setPosition] = useState(-1);

  const rules = useMemo(
    () =>
      autoFilter.filter((rule) => {
        if (queries.length === 0) return true;

        return queries.every(
          (query) =>
            rule.pattern?.includes(query) === true ||
            rule.source?.includes(query) === true ||
            rule.context?.includes(query) === true ||
            rule.memo?.includes(query) === true ||
            rule.include?.videoIds?.flat().some((id) => id.includes(query)) ===
              true ||
            (rule.target !== undefined &&
              Object.entries(rule.target).some(([key, value]) => {
                if (!value) return false;

                return decamelize(key).includes(query);
              })),
        );
      }),
    [autoFilter, queries],
  );

  const scroll = (index: number) => {
    ref.current?.scrollToIndex(index, { smooth: true, align: "nearest" });
  };

  useEffect(() => {
    const handle = ref.current;
    if (handle === null) return;

    // ブラウザによって復元されたスクロール位置をリセット
    handle.scrollTo(0);
  }, []);

  useEffect(() => {
    const keydownHandler = (event: KeyboardEvent) => {
      if (rules.length === 0 || event.ctrlKey || event.metaKey || event.altKey)
        return;

      if (event.key === "ArrowUp") {
        event.preventDefault();

        setPosition((previous) => {
          const next = Math.max(previous - 1, 0);
          scroll(next);

          return next;
        });
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();

        setPosition((previous) => {
          const next = Math.min(previous + 1, rules.length - 1);
          scroll(next);

          return next;
        });
      }
    };

    globalThis.addEventListener("keydown", keydownHandler);

    return () => {
      globalThis.removeEventListener("keydown", keydownHandler);
    };
  }, [rules.length]);

  return (
    <>
      <div>
        <input
          className="search"
          placeholder="ルールを検索"
          value={queryString}
          onChange={(event) => {
            setQuery(event.target.value);

            // クエリが更新されるたびにスクロール位置をリセット
            scroll(0);
            setPosition(-1);
          }}
        />
        <span className="info">
          {"ルール数: "}
          <span className="info-value">{rules.length}</span>
        </span>
      </div>
      <VList className="rule-container" ref={ref}>
        {rules.map((rule, index) => {
          if (rule.id === undefined) return null;

          return (
            <Rule key={rule.id} rule={rule} isSelected={index === position} />
          );
        })}
      </VList>
    </>
  );
}

interface RuleProps {
  rule: Partial<AutoRule>;
  isSelected: boolean;
}

function Rule({ rule, isSelected }: RuleProps) {
  const [autoFilter, save] = useSettingsStore(
    useShallow((state) => [state.settings.autoFilter, state.saveSettings]),
  );

  const pattern = rule.pattern;
  if (pattern === undefined) return null;

  return (
    <div className={clsx("rule", isSelected && "selected")}>
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
        {pattern.startsWith("nvc:") ? (
          <>
            <span className="prefix-nvc">nvc:</span>
            {pattern.slice(4)}
          </>
        ) : (
          pattern
        )}
      </div>
      <div className="rule-details">
        <div>
          <button
            className="rule-button"
            title="メモを編集"
            onClick={() => {
              const memo = prompt("メモを入力してください", rule.memo ?? "");
              if (memo === null) return;

              save({
                autoFilter: autoFilter.map((target) => {
                  if (target.id !== rule.id) return target;

                  if (memo === "") {
                    const { memo: _, ...rest } = target;

                    return rest;
                  }

                  return { ...target, memo };
                }),
              });
            }}
          >
            <Pencil size={20} />
          </button>
          <button
            className="rule-button"
            title="ソースとコンテキストを削除"
            onClick={() => {
              save({
                autoFilter: autoFilter.map((target) => {
                  if (target.id !== rule.id) return target;

                  const { source, context, ...rest } = target;

                  return rest;
                }),
              });
            }}
          >
            <BrushCleaning size={20} />
          </button>
        </div>
        {rule.target !== undefined &&
          Object.entries(rule.target).map(([key, value]) => {
            if (!value) return null;

            return (
              <Detail name="ターゲット" key={key}>
                {decamelize(key)}
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
