import CheckboxInput from "./CheckboxInput";
import type { ConditionalPick } from "type-fest";
import { useShallow } from "zustand/shallow";
import type { Settings } from "@/types/storage/settings.types";
import { useSettingsStore } from "@/utils/store";

export interface CheckboxProps {
  type: "checkbox";
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
  const [value, save] = useSettingsStore(
    useShallow((state) => [state.settings[id], state.saveSettings]),
  );

  return (
    <div className="setting">
      <label className="setting-label">
        <input
          type="checkbox"
          checked={value}
          onChange={(event) => {
            save({
              [id]: event.target.checked,
            });
          }}
        />
        {label}
      </label>
      {input !== undefined && <CheckboxInput {...input} />}
      {details !== undefined && (
        <div className="setting-details">{details}</div>
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
