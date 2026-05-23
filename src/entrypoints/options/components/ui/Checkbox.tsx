import CheckboxInput from "./CheckboxInput";
import type { ConditionalPick } from "type-fest";
import { useShallow } from "zustand/shallow";
import type { Settings } from "@/types/storage/settings.types";
import { useSettingsStore } from "@/utils/store";

export default function Checkboxes({ items }: { items: CheckboxProps[] }) {
  return items.map((props) => <Checkbox key={props.id} {...props} />);
}

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

function Checkbox({ id, label, details, input, childrenProps }: CheckboxProps) {
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
          <Checkboxes items={childrenProps} />
        </div>
      )}
    </div>
  );
}
