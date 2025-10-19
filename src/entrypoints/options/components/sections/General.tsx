import { generalSettings } from "@/utils/config.js";
import Checkbox from "../ui/Checkbox.js";
import H2 from "../ui/H2.js";
import { useStorageStore } from "@/utils/store.js";

export default function General() {
    const isAdvancedFeaturesVisible = useStorageStore(
        (state) => state.settings.isAdvancedFeaturesVisible,
    );

    return (
        <div className="settings-container">
            {(
                [
                    ["フィルタリング", "filtering"],
                    ["エディター", "editor"],
                ] as const
            ).map(([name, key]) => (
                <H2 name={name} key={key}>
                    {generalSettings.checkbox[key].map((props) => (
                        <Checkbox key={props.id} {...props} />
                    ))}
                </H2>
            ))}
            <H2 name={"高度な機能"}>
                {generalSettings.checkbox.advanced.top.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
                {isAdvancedFeaturesVisible &&
                    generalSettings.checkbox.advanced.features.map((props) => (
                        <Checkbox key={props.id} {...props} />
                    ))}
            </H2>
        </div>
    );
}
