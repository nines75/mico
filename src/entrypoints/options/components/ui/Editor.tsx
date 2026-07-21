import { useEffect, useEffectEvent, useRef } from "react";
import type { Extension, Range, RangeSet } from "@codemirror/state";
import { Compartment, EditorState, Transaction } from "@codemirror/state";
import type { DecorationSet, ViewUpdate } from "@codemirror/view";
import {
  Decoration,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightTrailingWhitespace,
  keymap,
  lineNumbers,
  MatchDecorator,
  ViewPlugin,
  WidgetType,
} from "@codemirror/view";
import {
  history,
  historyKeymap,
  redo,
  standardKeymap,
} from "@codemirror/commands";
import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import {
  autocompletion,
  closeBrackets,
  completionKeymap,
} from "@codemirror/autocomplete";
import { useSettingsStore } from "@/utils/store";
import type {
  ParseError,
  ParseWarning,
} from "@/entrypoints/background/parse-filter";
import {
  argsDirectives,
  noArgsDirectives,
  parseFilter,
} from "@/entrypoints/background/parse-filter";
import type { Diagnostic } from "@codemirror/lint";
import { linter as createLinter } from "@codemirror/lint";
import { objectEntries } from "ts-extras";
import type { Rule } from "@/entrypoints/background/rule";
import { decamelize } from "@/utils/util";

// -------------------------------------------------------------------------------------------
// ハイライト
// -------------------------------------------------------------------------------------------

function createHighlights(data: { regex: RegExp; style: string }[]) {
  return data.map(({ regex, style }) => {
    const decorator = new MatchDecorator({
      regexp: regex,
      decoration: Decoration.mark({
        attributes: { style },
      }),
    });

    return ViewPlugin.fromClass(
      class {
        decorations: RangeSet<Decoration>;

        constructor(view: EditorView) {
          this.decorations = decorator.createDeco(view);
        }
        update(update: ViewUpdate) {
          this.decorations = decorator.updateDeco(update, this.decorations);
        }
      },
      {
        decorations: (v) => v.decorations,
      },
    );
  });
}

const directiveStyle = "color: lime";

const highlights = createHighlights([
  { regex: /^#.*$/g, style: "color: gray" },
  { regex: /^\/.*\/[isuvm]*$/g, style: "color: orange" },
  { regex: /^@(?:end|s)\s*$/g, style: directiveStyle },
  {
    regex: new RegExp(String.raw`^@(?:${argsDirectives.join("|")})\s`, "g"),
    style: directiveStyle,
  },
  {
    regex: new RegExp(String.raw`^@(?:${noArgsDirectives.join("|")})\s*$`, "g"),
    style: directiveStyle,
  },
]);

// -------------------------------------------------------------------------------------------
// 補完
// -------------------------------------------------------------------------------------------

function createCompletions(options: Completion[]): Extension {
  return autocompletion({
    override: [
      (context: CompletionContext): CompletionResult | null => {
        const word = context.matchBefore(/@[\w-]*/);
        if (word === null || (word.from === word.to && !context.explicit))
          return null;

        return {
          from: word.from,
          options,
        };
      },
    ],
  });
}

const completions = createCompletions([
  {
    label: "@end",
    type: "keyword",
  },
  {
    label: "@s",
    type: "keyword",
  },
  ...argsDirectives.map((directive) => ({
    label: `@${directive} `,
    type: "keyword",
  })),
  ...noArgsDirectives.map((directive) => ({
    label: `@${directive}`,
    type: "keyword",
  })),
]);

// -------------------------------------------------------------------------------------------
// テーマ
// -------------------------------------------------------------------------------------------

const theme = EditorView.theme(
  {
    "&": {
      color: "lightgray",
      backgroundColor: "black",
    },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "white" },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: "#223a5a" },
    ".cm-activeLine": { backgroundColor: "rgba(128, 128, 128, 0.3)" }, // gray 透明度30%
    ".cm-gutters": {
      color: "gray",
    },
    ".cm-activeLineGutter": {
      color: "white",
      backgroundColor: "transparent",
    },
  },
  { dark: true },
);

// -------------------------------------------------------------------------------------------
// Linter
// -------------------------------------------------------------------------------------------

const linterMessageMap: Record<
  ParseWarning["type"] | ParseError["type"],
  string
> = {
  target: "ターゲットを指定する必要があります。",
  strict_with_disable: "@strictは@disableと併用できません。",
  directive: "無効なディレクティブです。",
  regex: "無効な正規表現です。",
  regex_flag: "無効な正規表現フラグです。",
  args: "引数が必要です。",
} as const;

const linter = createLinter((view) => {
  const diagnostics: Diagnostic[] = [];

  const doc = view.state.doc;
  const { warnings, errors } = parseFilter(doc.toString());

  // warning
  for (const { index, type } of warnings) {
    const line = doc.line(index + 1);

    diagnostics.push({
      from: line.from,
      to: line.to,
      severity: "warning",
      markClass: "editor-warning",
      message: linterMessageMap[type],
    });
  }

  // error
  for (const { index, type } of errors) {
    const line = doc.line(index + 1);

    diagnostics.push({
      from: line.from,
      to: line.to,
      severity: "error",
      markClass: "editor-error",
      message: linterMessageMap[type],
    });
  }

  return diagnostics;
});

// -------------------------------------------------------------------------------------------
// ヒント
// -------------------------------------------------------------------------------------------

class HintWidget extends WidgetType {
  private rule: Rule;

  constructor(rule: Rule) {
    super();

    this.rule = rule;
  }

  override toDOM(): HTMLElement {
    const rule = this.rule;
    const texts: string[] = [];

    for (const [key, value] of Object.entries(rule.target)) {
      if (value) texts.push(`@${decamelize(key)}`);
    }

    if (rule.strict) texts.push("@strict");
    if (rule.disable) texts.push("@disable");

    for (const { toggle, prefix } of [
      { toggle: rule.include, prefix: "include" },
      { toggle: rule.exclude, prefix: "exclude" },
    ]) {
      for (const [key, value] of objectEntries(toggle)) {
        if (value.length === 0) continue;

        const directive = `@${prefix}-${decamelize(key)}`;
        const params = `(${value.map((array) => `[${array.join(" ")}]`).join(" ")})`;
        texts.push(`${directive}${params}`);
      }
    }

    const span = document.createElement("span");
    span.textContent = ` ${texts.join(", ")}`;
    span.style.color = "gray";

    return span;
  }
}

function createHints(view: EditorView) {
  const widgets: Range<Decoration>[] = [];

  const doc = view.state.doc;
  const rules = parseFilter(doc.toString(), true).rules;

  for (const { from, to } of view.visibleRanges) {
    for (const rule of rules) {
      const line = doc.line((rule.index as number) + 1);

      // viewport外にはウィジットを挿入しない
      if (line.to < from || to < line.from) continue;

      const decoration = Decoration.widget({
        widget: new HintWidget(rule),
        side: 1, // カーソル移動時などの挙動が不自然になるのを防止
      });
      widgets.push(decoration.range(line.to));
    }
  }

  return Decoration.set(widgets);
}

const hints = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = createHints(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged)
        this.decorations = createHints(update.view);
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

// -------------------------------------------------------------------------------------------
// 拡張機能
// -------------------------------------------------------------------------------------------

const hintsCompartment = new Compartment();

const extensions = [
  keymap.of([
    ...standardKeymap,
    ...historyKeymap,
    ...completionKeymap,
    {
      key: "Ctrl-Shift-z",
      run: redo,
    },
  ]),
  lineNumbers(),
  history(),
  dropCursor(),
  closeBrackets(),
  highlightActiveLine(),
  highlightActiveLineGutter(),
  highlightTrailingWhitespace(),
  highlights,
  completions,
  linter,
  theme,
  hintsCompartment.of([]),
];

// -------------------------------------------------------------------------------------------
// 本体
// -------------------------------------------------------------------------------------------

interface EditorProps {
  value: string;
  onChange: (text: string) => void;
}

export default function Editor({ value, onChange }: EditorProps) {
  const view = useRef<EditorView | null>(null);
  const parent = useRef<HTMLDivElement | null>(null);
  const showParsingHints = useSettingsStore(
    (state) => state.settings.showParsingHints,
  );

  const getExtensions = () => {
    const onUpdate = EditorView.updateListener.of((update) => {
      if (
        update.docChanged &&
        // ユーザー入力以外ではonChangeを発火させない
        update.transactions.some(
          (transaction) =>
            transaction.annotation(Transaction.userEvent) !== undefined,
        )
      )
        onChange(update.state.doc.toString());
    });

    return [...extensions, onUpdate];
  };
  const createEditorState = useEffectEvent(() => {
    return EditorState.create({
      doc: value,
      extensions: getExtensions(),
    });
  });

  useEffect(() => {
    if (parent.current === null) return;

    view.current = new EditorView({
      state: createEditorState(),
      parent: parent.current,
    });

    // クリーンアップ処理
    return () => {
      view.current?.destroy();
    };
  }, [parent]);

  // 外部での変更を反映
  useEffect(() => {
    const current = view.current;
    if (current === null) return;

    // ユーザー入力による発火を弾く
    const currentValue = current.state.doc.toString();
    if (currentValue === value) return;

    current.dispatch({
      changes: {
        from: 0,
        to: currentValue.length,
        insert: value,
      },
    });
  }, [value]);

  useEffect(() => {
    const current = view.current;
    if (current === null) return;

    current.dispatch({
      effects: hintsCompartment.reconfigure(showParsingHints ? hints : []),
    });
  }, [showParsingHints]);

  return <div ref={parent} className="editor-container" />;
}
