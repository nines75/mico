import { useState } from "react";
import Checkbox from "../ui/Checkbox.js";
import { useShallow } from "zustand/shallow";
import CustomNicoru from "../ui/CustomNicoru.js";
import {
    defaultSettings,
    expandNicoruSettings,
    messages,
} from "@/utils/config.js";
import { useStorageStore } from "@/utils/store.js";
import Details from "@/components/Details.js";
import H2 from "../ui/H2.js";

export default function ExpandNicoru() {
    const [nicoruCounts, save] = useStorageStore(
        useShallow((state) => [
            state.settings.nicoruCounts,
            state.saveSettings,
        ]),
    );
    const [input, setInput] = useState("");

    const saveDefault = () => {
        save({
            nicoruCounts: defaultSettings.nicoruCounts,
            nicoruColors: defaultSettings.nicoruColors,
        });
    };

    const handleSubmit = () => {
        if (input === "") return;
        if (input.length > 15) {
            alert(messages.settings.numberTooBig);
            setInput("");
            return;
        }

        const newCount = Number(input);

        if (nicoruCounts.includes(newCount)) {
            alert(messages.settings.valueAlreadyExists);
            setInput("");
            return;
        }

        const newNicoruCounts = [...nicoruCounts, newCount].sort(
            (a, b) => b - a,
        );

        save({ nicoruCounts: newNicoruCounts });
        setInput("");
    };

    return (
        <H2 name="拡張ニコる">
            {expandNicoruSettings.checkbox.map((props) => (
                <Checkbox key={props.id} {...props} />
            ))}
            <div className="setting">
                <Details id={"isOpenCustomColor"} summary={"カスタムカラー"}>
                    <button
                        className="small-button"
                        onClick={() => {
                            if (!confirm(messages.settings.resetNicoruCounts))
                                return;

                            saveDefault();
                        }}
                    >
                        リセット
                    </button>
                    <form
                        className="nicoru-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit();
                        }}
                    >
                        <label>
                            <input
                                type="number"
                                value={input}
                                min={0}
                                placeholder="追加したい基準値を入力"
                                onChange={(e) => setInput(e.target.value)}
                            />
                            以上
                        </label>
                    </form>
                    {nicoruCounts.map((id) => (
                        <CustomNicoru key={id} {...{ id }} />
                    ))}
                </Details>
            </div>
        </H2>
    );
}
