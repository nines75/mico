import { useEffect, useInsertionEffect, useRef } from "react";
import {
    EditorState,
    Extension,
    RangeSet,
    Transaction,
} from "@codemirror/state";
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
    ViewUpdate,
} from "@codemirror/view";
import {
    history,
    historyKeymap,
    redo,
    standardKeymap,
} from "@codemirror/commands";
import {
    autocompletion,
    closeBrackets,
    Completion,
    CompletionContext,
    completionKeymap,
    CompletionResult,
} from "@codemirror/autocomplete";
import { getCM, vim } from "@replit/codemirror-vim";
import { Settings } from "@/types/storage/settings.types.js";
import { useStorageStore } from "@/utils/store.js";

const generalHighlights = createHighlights([
    { regex: /(?<!\\)#.*/g, style: "color: gray" },
]);
const ngWordHighlights = createHighlights([
    { regex: /^@strict/g, style: "color: coral" },
    { regex: /^!/g, style: "color: coral; font-weight: bold" },
    { regex: /^(@include|@exclude)/g, style: "color: lime" },
    { regex: /^@end/g, style: "color: cyan" },
    { regex: /^\\/g, style: "color: red; font-weight: bold" },
]);
const ngCommandHighlights = [
    ...createHighlights([{ regex: /^@disable/g, style: "color: yellow" }]),
    ...ngWordHighlights,
];

const ngWordCompletions: Completion[] = [
    {
        label: "@strict",
        type: "keyword",
    },
    {
        label: "@include",
        type: "keyword",
    },
    {
        label: "@exclude",
        type: "keyword",
    },
    {
        label: "@end",
        type: "keyword",
    },
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
    closeBrackets(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    highlightTrailingWhitespace(),
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
    const initialEditorState = useRef<EditorState | null>(null);

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
            ...(settings.isVimKeybindingsEnabled ? vimExtensions : []), // Vim拡張は他のkeymapに関する拡張より前に配置する
            ...baseExtensions,
            ...dynamicExtensions,
        ];
    };

    // useEffectEventの模倣
    useInsertionEffect(() => {
        initialEditorState.current = EditorState.create({
            doc: value,
            extensions: getExtensions(),
        });
    }, []);

    useEffect(() => {
        if (parent.current === null || initialEditorState.current === null)
            return;

        view.current = new EditorView({
            state: initialEditorState.current,
            parent: parent.current,
        });

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
    if (id !== "ngCommand" && id !== "ngWord") return generalHighlights;

    const customHighlights = (() => {
        switch (id) {
            case "ngCommand":
                return ngCommandHighlights;
            case "ngWord":
                return ngWordHighlights;
        }
    })();

    return [...generalHighlights, ...customHighlights];
}

function getCompletions(id: keyof Settings): Extension {
    if (id !== "ngCommand" && id !== "ngWord") return [];

    const options = (() => {
        switch (id) {
            case "ngCommand":
                return ngCommandCompletions;
            case "ngWord":
                return ngWordCompletions;
        }
    })();

    return autocompletion({
        override: [
            (context: CompletionContext): CompletionResult | null => {
                const word = context.matchBefore(/@\w*/);
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
