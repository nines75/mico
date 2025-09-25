import { generalSettings } from "@/utils/config.js";
import Checkbox from "../ui/Checkbox.js";
import H2 from "../ui/H2.js";

export default function General() {
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
        </div>
    );
}
