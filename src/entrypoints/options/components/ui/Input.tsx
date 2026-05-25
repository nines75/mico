import type { ConditionalPick } from "type-fest";
import { useShallow } from "zustand/shallow";
import type { Settings } from "@/types/storage/settings.types";
import { useSettingsStore } from "@/utils/store";

export interface InputProps {
  type: "input";
  id: keyof ConditionalPick<Settings, string>;
  label: string;
}

export default function Input({ id, label }: InputProps) {
  const [value, save] = useSettingsStore(
    useShallow((state) => [state.settings[id], state.saveSettings]),
  );

  return (
    <div className="setting">
      <label className="setting-label">
        <div className="input-container">
          {label}
          <input
            className="input"
            value={value}
            onChange={(event) => {
              save({ [id]: event.target.value });
            }}
          />
        </div>
      </label>
    </div>
  );
}
