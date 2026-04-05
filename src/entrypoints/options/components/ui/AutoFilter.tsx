import type { AutoRule } from "@/entrypoints/background/rule";
import { useStorageStore } from "@/utils/store";
import decamelize from "decamelize";
import { X } from "lucide-react";
import type { PartialDeep } from "type-fest";
import { useShallow } from "zustand/shallow";

export default function AutoFilter() {
    const autoFilter = useStorageStore((state) => state.settings.autoFilter);

    return (
        <div className="tab-content">
            {autoFilter.map((rule) => (
                <Rule rule={rule} key={rule.id} />
            ))}
        </div>
    );
}

interface RuleProps {
    rule: PartialDeep<AutoRule>;
}

function Rule({ rule }: RuleProps) {
    const [autoFilter, save] = useStorageStore(
        useShallow((state) => [state.settings.autoFilter, state.saveSettings]),
    );

    const pattern = rule.rule;
    if (pattern === undefined) return null;

    return (
        <div className="rule">
            <div className="rule-pattern">
                <button
                    className="rule-delete-button"
                    onClick={() => {
                        if (
                            !confirm(
                                `以下のルールを削除しますか？\n\n${pattern.toString()}`,
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
                {pattern.toString()}
            </div>
            <div className="rule-details">
                {rule.target !== undefined &&
                    Object.entries(rule.target).map(([key, value]) => {
                        if (!value) return;

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
                    <Detail name="コンテキスト">{rule.context}</Detail>
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
