import type { Settings } from "@/types/storage/settings.types";
import { useSettingsStore } from "@/utils/store";
import type { ConditionalPick } from "type-fest";
import { useShallow } from "zustand/shallow";

interface CheckboxInputProps {
  id: keyof ConditionalPick<Settings, number>;
  label: string;
  min?: number;
  max?: number;
}

export default function CheckboxInput({
  id,
  label,
  min,
  max,
}: CheckboxInputProps) {
  const [value, save] = useSettingsStore(
    useShallow((state) => [state.settings[id], state.saveSettings]),
  );

  return (
    <label className="checkbox-input">
      <input
        {...{ min, max }}
        type="number"
        size={5}
        value={value}
        onChange={(event) => {
          save({ [id]: Number(event.target.value) });
        }}
      />
      {label}
    </label>
  );
}
