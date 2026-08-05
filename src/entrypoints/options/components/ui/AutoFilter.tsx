import { targetKeyMap, type AutoRule } from "@/entrypoints/background/rule";
import { useSettingsStore } from "@/utils/store";
import { BrushCleaning, Pencil, X } from "lucide-react";
import { useShallow } from "zustand/shallow";
import type { VListHandle } from "virtua";
import { VList } from "virtua";
import { escapeNewline } from "@/utils/util";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { Settings } from "@/types/storage/settings.types";
import { objectEntries } from "ts-extras";

export default function AutoFilter() {
  const vlistRef = useRef<VListHandle>(null);
  const autoFilter = useSettingsStore((state) => state.settings.autoFilter);

  const [queryString, setQueryString] = useState("");
  const queries = queryString.split(/\s+/).filter((value) => value !== "");

  const [position, setPosition] = useState<number | undefined>();

  const rules = useMemo(
    () => filterRules(autoFilter, queries),
    [autoFilter, queries],
  );

  const scroll = (index: number) => {
    vlistRef.current?.scrollToIndex(index, { smooth: true, align: "center" });
  };

  // 編集後に編集前と同じルールを選択させるための関数
  const edit = (action: () => void) => {
    // 選択を復元するかに関わらず必ず編集自体は実行
    action();

    if (position === undefined) return;

    // rulesの値はこの関数生成時点で固定されているため再計算
    const newRules = filterRules(
      useSettingsStore.getState().settings.autoFilter,
      queries,
    );
    if (newRules.length === 0) return;

    // 編集前に選択していたルールID
    const id = rules[position]?.id;
    if (id === undefined) return;

    // 編集後のルールに同じIDのルールが存在するか確認
    const index = newRules.findIndex((rule) => rule.id === id);
    if (index === -1) {
      // 見つからなかった場合、現在の位置を維持する
      // ただし末尾を選択していた場合にはみ出ることがあるため調整
      setPosition((previous) => Math.min(previous ?? 0, newRules.length - 1));
    } else {
      // 見つかった場合、その位置に移動
      setPosition(index);
    }
  };

  // rules.lengthとpositionは常に最新の値を参照したいが、
  // useEffect内で宣言するとクロージャによって過去の値を参照してしまう。
  // この2つを依存に含めることで最新の値を参照できるが、無駄なイベントリスナーの追加・削除が発生する。
  // そのためuseEffectEventを使う
  const keydownHandler = useEffectEvent((event: KeyboardEvent) => {
    if (rules.length === 0 || event.ctrlKey || event.metaKey || event.altKey)
      return;

    if (event.key === "ArrowUp") {
      event.preventDefault();

      const next = position === undefined ? 0 : Math.max(position - 1, 0);
      setPosition(next);
      scroll(next);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      const next =
        position === undefined ? 0 : Math.min(position + 1, rules.length - 1);
      setPosition(next);
      scroll(next);
    }
  });

  useEffect(() => {
    // ブラウザによって復元されたスクロール位置をリセット
    vlistRef.current?.scrollTo(0);

    globalThis.addEventListener("keydown", keydownHandler);

    return () => {
      globalThis.removeEventListener("keydown", keydownHandler);
    };
  }, []);

  return (
    <>
      <div>
        <input
          className="search"
          placeholder="ルールを検索"
          value={queryString}
          onChange={(event) => {
            setQueryString(event.target.value);

            // クエリが更新されるたびにスクロール位置をリセット
            setPosition(undefined);
            scroll(0);
          }}
        />
        <span className="info">
          {"ルール数: "}
          <span className="info-value">{rules.length}</span>
        </span>
      </div>
      <VList className="rule-container" ref={vlistRef}>
        {rules.map((rule, index) => {
          if (rule.id === undefined) return null;

          return (
            <Rule
              key={rule.id}
              isSelected={index === position}
              {...{ rule, edit }}
            />
          );
        })}
      </VList>
    </>
  );
}

function filterRules(autoFilter: Settings["autoFilter"], queries: string[]) {
  return autoFilter.filter((rule) => {
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
          objectEntries(rule.target).some(([key, value]) => {
            if (!value) return false;

            return targetKeyMap[key].includes(query);
          })),
    );
  });
}

interface RuleProps {
  rule: Partial<AutoRule>;
  isSelected: boolean;
  edit: (action: () => void) => void;
}

function Rule({ rule, isSelected, edit }: RuleProps) {
  const [autoFilter, save] = useSettingsStore(
    useShallow((state) => [state.settings.autoFilter, state.saveSettings]),
  );

  const pattern = rule.pattern;
  if (pattern === undefined) return null;

  return (
    <div className={clsx("rule", isSelected && "selected")}>
      <div className="rule-pattern">
        <button
          type="button"
          className="rule-remove-button"
          title="ルールを削除"
          onClick={() => {
            edit(() => {
              save({
                autoFilter: autoFilter.filter(({ id }) => id !== rule.id),
              });
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
            type="button"
            className="rule-button"
            title="メモを編集"
            onClick={() => {
              const memo = prompt("メモを入力してください", rule.memo ?? "");
              if (memo === null) return;

              edit(() => {
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
              });
            }}
          >
            <Pencil size={20} />
          </button>
          <button
            type="button"
            className="rule-button"
            title="ソースとコンテキストを削除"
            onClick={() => {
              edit(() => {
                save({
                  autoFilter: autoFilter.map((target) => {
                    if (target.id !== rule.id) return target;

                    const { source, context, ...rest } = target;

                    return rest;
                  }),
                });
              });
            }}
          >
            <BrushCleaning size={20} />
          </button>
        </div>
        {rule.target !== undefined &&
          objectEntries(rule.target).map(([key, value]) => {
            if (!value) return null;

            return (
              <Detail name="ターゲット" key={key}>
                {targetKeyMap[key]}
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
