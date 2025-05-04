import { Fragment } from "react";
import CheckboxInput from "./CheckboxInput.js";
import { ConditionalPick } from "type-fest";
import { useShallow } from "zustand/shallow";
import { Settings } from "@/types/storage/settings.types.js";
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
    children?: CheckboxProps[];
}

export default function Checkbox({
    id,
    label,
    details,
    input,
    children,
}: CheckboxProps) {
    const [isChecked, save] = useStorageStore(
        useShallow((state) => [state.settings[id], state.saveSettings])
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
                    {details.split("\n").map((line, index) => (
                        <Fragment key={index}>
                            {line}
                            <br />
                        </Fragment>
                    ))}
                </div>
            )}
            {children !== undefined && (
                <div className="settings-container">
                    {children.map((props) => (
                        <Checkbox key={props.id} {...props} />
                    ))}
                </div>
            )}
        </div>
    );
}
