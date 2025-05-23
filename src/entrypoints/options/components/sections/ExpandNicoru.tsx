import { useState } from "react";
import Checkbox from "../ui/Checkbox.js";
import { useShallow } from "zustand/shallow";
import CustomNicoru from "../ui/CustomNicoru.js";
import {
    defaultSettings,
    texts,
    expandNicoruSettings,
} from "@/utils/config.js";
import { useStorageStore } from "@/utils/store.js";
import Details from "@/components/Details.js";

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
            alert(texts.settings.messageNumberTooBig);
            setInput("");
            return;
        }

        const newCount = Number(input);

        if (nicoruCounts.includes(newCount)) {
            alert(texts.settings.messageValueAlreadyExists);
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
        <section>
            <div className="header-container">
                <h2>拡張ニコる</h2>
            </div>
            <div className="settings-container">
                {expandNicoruSettings.checkbox.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
                <div className="setting">
                    <Details
                        id={"isOpenCustomColor"}
                        summary={"カスタムカラー"}
                    >
                        <button
                            className="small-button"
                            onClick={() => {
                                if (
                                    !confirm(
                                        texts.settings.messageResetNicoruCounts,
                                    )
                                )
                                    return;

                                saveDefault();
                            }}
                        >
                            リセット
                        </button>
                        <form
                            className="nicoru-form"
                            onSubmit={async (event) => {
                                try {
                                    event.preventDefault();
                                    await handleSubmit();
                                } catch (e) {
                                    console.error(e);
                                }
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
            </div>
        </section>
    );
}
