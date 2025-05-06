import Details from "./Details.js";
import { ConditionalPick } from "type-fest";
import Editor from "./Editor.js";
import { useShallow } from "zustand/shallow";
import { Settings } from "@/types/storage/settings.types.js";
import { useStorageStore } from "@/utils/store.js";
import { texts } from "@/utils/config.js";

export type FilterId = keyof ConditionalPick<Settings, string>;

export interface FilterAreaProps {
    id: FilterId;
    name: string;
}

export default function FilterArea({ id, name }: FilterAreaProps) {
    const [text, save] = useStorageStore(
        useShallow((state) => [state.settings[id], state.saveSettings]),
    );

    const saveUpdate = (value: string) => {
        save({ [id]: value });
    };

    return (
        <div className="setting">
            <Details id={getOpenId(id)} summary={name}>
                {id === "ngUserId" && (
                    <div>
                        <button
                            className="small-button"
                            onClick={() => {
                                const data = popHeadRule(text);
                                if (!data.isDeleted) return;

                                const confirmText =
                                    texts.settings.messagePopHeadRule.replace(
                                        "{target}",
                                        data.deletedRule ?? "",
                                    );
                                if (!confirm(confirmText)) return;

                                saveUpdate(data.rules ?? "");
                            }}
                        >
                            先頭削除
                        </button>
                    </div>
                )}
                <Editor
                    {...{ id }}
                    value={text}
                    onChange={(str) => saveUpdate(str)}
                />
            </Details>
        </div>
    );
}

function getOpenId(id: FilterId): keyof ConditionalPick<Settings, boolean> {
    switch (id) {
        case "ngUserId":
            return "isOpenNgUserIdFilter";
        case "ngCommand":
            return "isOpenNgCommandFilter";
        case "ngWord":
            return "isOpenNgWordFilter";
    }
}

function popHeadRule(text: string): {
    isDeleted: boolean;
    rules?: string;
    deletedRule?: string;
} {
    const rules = text.split("\n");
    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        if (rule !== undefined && rule !== "" && !rule.startsWith("#")) {
            rules.splice(i, 1);

            return {
                isDeleted: true,
                rules: rules.join("\n"),
                deletedRule: rule,
            };
        }
    }

    return {
        isDeleted: false,
    };
}
