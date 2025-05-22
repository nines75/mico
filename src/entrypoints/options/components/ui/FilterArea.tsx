import Details from "./Details.js";
import { ConditionalPick } from "type-fest";
import Editor from "./Editor.js";
import { useShallow } from "zustand/shallow";
import { Settings } from "@/types/storage/settings.types.js";
import { useStorageStore } from "@/utils/store.js";

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
