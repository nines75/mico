import { useEffect, useEffectEvent, useRef } from "react";
import type { Extension, RangeSet } from "@codemirror/state";
import { EditorState, Transaction } from "@codemirror/state";
import type { ViewUpdate } from "@codemirror/view";
import {
    Decoration,
    drawSelection,
    dropCursor,
    EditorView,
    highlightActiveLine,
    highlightActiveLineGutter,
    highlightTrailingWhitespace,
    keymap,
    lineNumbers,
    MatchDecorator,
    ViewPlugin,
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
import { getCM, vim } from "@replit/codemirror-vim";
import type { Settings } from "@/types/storage/settings.types";
import { useStorageStore } from "@/utils/store";
import { catchAsync } from "@/utils/util";
import { sendMessageToBackground } from "@/utils/browser";
import { argsDirectives } from "@/entrypoints/background/parse-filter";

const toggleDirectivesRegex = RegExp(
    `^(?:${argsDirectives.map((directive) => `@${directive}`).join("|")}|@v)\\s`,
    "g",
);

const generalHighlights = createHighlights([
    { regex: /^#.*$/g, style: "color: gray" },
    { regex: /^\/.*\/[isuvm]*$/g, style: "color: orange" },
]);
const ngUserIdHighlights = createHighlights([
    { regex: toggleDirectivesRegex, style: "color: lime" },
    { regex: /^@end\s*$/g, style: "color: cyan" },
]);
const ngWordHighlights = [
    ...createHighlights([
        { regex: /^(?:@strict|@s)\s*$/g, style: "color: coral" },
    ]),
    ...ngUserIdHighlights,
];
const ngCommandHighlights = [
    ...createHighlights([{ regex: /^@disable\s*$/g, style: "color: yellow" }]),
    ...ngWordHighlights,
];

const ngUserIdCompletions: Completion[] = [
    ...argsDirectives.map((directive) => ({
        label: `@${directive} `,
        type: "keyword",
    })),
    {
        label: "@v ",
        type: "keyword",
    },
    {
        label: "@end",
        type: "keyword",
    },
];
const ngWordCompletions: Completion[] = [
    {
        label: "@strict",
        type: "keyword",
    },
    {
        label: "@s",
        type: "keyword",
    },
    ...ngUserIdCompletions,
];
const ngCommandCompletions: Completion[] = [
    {
        label: "@disable",
        type: "keyword",
    },
    ...ngWordCompletions,
];

const theme = EditorView.theme(
    {
        "&": {
            color: "lightgray",
            backgroundColor: "black",
        },
        ".cm-cursor, .cm-dropCursor": { borderLeftColor: "white" },
        ".cm-cursorLayer > .cm-fat-cursor": {
            backgroundColor: "darkred",
        },
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

// ノーマルモードやビジュアルモードで全角入力した後に挿入モードに入ると正しく入力できなくなる不具合を修正する拡張
const vimImeIssueFixer = EditorView.domEventHandlers({
    input(_, view) {
        const vimState = getCM(view)?.state.vim;
        if (vimState === undefined || vimState === null) return false;

        if (!(vimState.insertMode || vimState.mode === "replace")) {
            // IMEによる入力をキャンセル
            view.contentDOM.blur();
            view.contentDOM.focus();

            return true;
        }

        return false;
    },
});
const baseExtensions = [
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
    highlightActiveLine(),
    highlightActiveLineGutter(),
    theme,
];
const vimExtensions = [
    vim({ status: true }),
    drawSelection({ cursorBlinkRate: 0 }),
    EditorState.allowMultipleSelections.of(true),
    vimImeIssueFixer,
];

interface EditorProps {
    id: keyof Settings;
    value: string;
    onChange: (text: string) => void;
}

export default function Editor({ id, value, onChange }: EditorProps) {
    const view = useRef<EditorView | null>(null);
    const parent = useRef<HTMLDivElement | null>(null);

    const getExtensions = () => {
        const settings = useStorageStore.getState().settings;
        const updateCallback = EditorView.updateListener.of((update) => {
            if (
                update.docChanged &&
                // ユーザー入力以外ではonChangeを発火させない
                update.transactions.some(
                    (transaction) =>
                        transaction.annotation(Transaction.userEvent) !==
                        undefined,
                )
            )
                onChange(update.state.doc.toString());
        });
        const dynamicExtensions = [
            updateCallback,
            getHighlights(id),
            getCompletions(id),
        ];

        return [
            ...(settings.isVimModeEnabled ? vimExtensions : []), // Vim拡張は他のkeymapに関する拡張より前に配置する
            ...(settings.isCloseBrackets ? [closeBrackets()] : []),
            ...(settings.isHighlightTrailingWhitespace
                ? [highlightTrailingWhitespace()]
                : []),
            ...baseExtensions,
            ...dynamicExtensions,
        ];
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

        // エディタはコンテンツスクリプト(クイック編集)でも使うのでメッセージ経由でIMEをオフにする
        const settings = useStorageStore.getState().settings;
        if (settings.isVimModeEnabled && settings.isImeDisabledByContext) {
            // ノーマルモードに戻った時
            const cm = getCM(view.current);
            cm?.on(
                "vim-mode-change",
                catchAsync(async (obj: { mode: string }) => {
                    if (obj.mode === "normal") {
                        await sendMessageToBackground({ type: "disable-ime" });
                    }
                }),
            );

            // エディタにフォーカスした時
            view.current.contentDOM.addEventListener(
                "focus",
                catchAsync(async () => {
                    await sendMessageToBackground({ type: "disable-ime" });
                }),
            );
        }

        // クリーンアップ処理
        return () => {
            view.current?.destroy();
        };
    }, [parent]);

    useEffect(() => {
        const current = view.current;
        if (current === null) return;

        const currentValue = current.state.doc.toString();
        if (currentValue === value) return; // これをチェックしないと挙動がおかしくなる

        current.dispatch({
            changes: {
                from: 0,
                to: currentValue.length,
                insert: value,
            },
        });
    }, [value]);

    return <div ref={parent} />;
}

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
                    this.decorations = decorator.updateDeco(
                        update,
                        this.decorations,
                    );
                }
            },
            {
                decorations: (v) => v.decorations,
            },
        );
    });
}

function getHighlights(id: keyof Settings): Extension {
    if (id !== "ngUserId" && id !== "ngCommand" && id !== "ngWord")
        return generalHighlights;

    const customHighlights = (() => {
        switch (id) {
            case "ngUserId":
                return ngUserIdHighlights;
            case "ngCommand":
                return ngCommandHighlights;
            case "ngWord":
                return ngWordHighlights;
        }
    })();

    return [...generalHighlights, ...customHighlights];
}

function getCompletions(id: keyof Settings): Extension {
    if (id !== "ngUserId" && id !== "ngCommand" && id !== "ngWord") return [];

    const options = (() => {
        switch (id) {
            case "ngUserId":
                return ngUserIdCompletions;
            case "ngCommand":
                return ngCommandCompletions;
            case "ngWord":
                return ngWordCompletions;
        }
    })();

    return autocompletion({
        override: [
            (context: CompletionContext): CompletionResult | null => {
                const word = context.matchBefore(/@[\w-]*/);
                if (
                    word === null ||
                    (word.from === word.to && !context.explicit)
                )
                    return null;

                return {
                    from: word.from,
                    options,
                };
            },
        ],
    });
}
