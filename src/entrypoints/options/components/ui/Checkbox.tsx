import { Fragment } from "react";
import CheckboxInput from "./CheckboxInput.js";
import type { ConditionalPick } from "type-fest";
import { useShallow } from "zustand/shallow";
import type { Settings } from "@/types/storage/settings.types.js";
import { useStorageStore } from "@/utils/store.js";

export interface CheckboxProps {
    id: keyof ConditionalPick<Settings, boolean>;
    label: string;
    details?: string;
    input?: {
        id: keyof ConditionalPick<Settings, number>;
        label: string;
        min?: number;
        max?: number;
    };
    childrenProps?: CheckboxProps[];
}

export default function Checkbox({
    id,
    label,
    details,
    input,
    childrenProps,
}: CheckboxProps) {
    const [isChecked, save] = useStorageStore(
        useShallow((state) => [state.settings[id], state.saveSettings]),
    );

    return (
        <div className="setting">
            <label>
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                        save({
                            [id]: e.target.checked,
                        });
                    }}
                />
                {label}
            </label>
            {input !== undefined && <CheckboxInput {...input} />}
            {details !== undefined && (
                <div className="setting-details">
                    {details.split("\n").map((line, index, array) => (
                        <Fragment key={index}>
                            {line}
                            {index !== array.length - 1 && <br />}
                        </Fragment>
                    ))}
                </div>
            )}
            {childrenProps !== undefined && (
                <div className="settings-container">
                    {childrenProps.map((props) => (
                        <Checkbox key={props.id} {...props} />
                    ))}
                </div>
            )}
        </div>
    );
}
