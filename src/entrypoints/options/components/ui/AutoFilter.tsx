import type { AutoRule } from "@/entrypoints/background/rule";
import { useStorageStore } from "@/utils/store";
import decamelize from "decamelize";
import { X } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { VList } from "virtua";
import { escapeNewline } from "@/utils/util";

export default function AutoFilter() {
    const autoFilter = useStorageStore((state) => state.settings.autoFilter);

    return (
        <VList className="rule-container">
            {autoFilter.map((rule) => {
                if (rule.id === undefined) return null;

                return <Rule rule={rule} key={rule.id} />;
            })}
        </VList>
    );
}

interface RuleProps {
    rule: Partial<AutoRule>;
}

function Rule({ rule }: RuleProps) {
    const [autoFilter, save] = useStorageStore(
        useShallow((state) => [state.settings.autoFilter, state.saveSettings]),
    );

    const pattern = rule.pattern;
    if (pattern === undefined) return null;

    return (
        <div className="rule">
            <div className="rule-pattern">
                <button
                    className="rule-delete-button"
                    onClick={() => {
                        if (
                            !confirm(
                                `以下のルールを削除しますか？\n\n${pattern}`,
                            )
                        )
                            return;

                        save({
                            autoFilter: autoFilter.filter(
                                ({ id }) => id !== rule.id,
                            ),
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
                    <Detail name="include-video-ids">
                        {rule.include.videoIds}
                    </Detail>
                )}
                {rule.source !== undefined && (
                    <Detail name="ソース">{rule.source}</Detail>
                )}
                {rule.context !== undefined && (
                    <Detail name="コンテキスト">
                        {escapeNewline(rule.context)}
                    </Detail>
                )}
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
            <span className="value">{children}</span>
        </span>
    );
}
