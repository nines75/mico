import { generalSettings } from "@/utils/config.js";
import Checkbox from "../ui/Checkbox.js";
import H2 from "../ui/H2.js";

export default function General() {
    return (
        <div className="settings-container">
            <H2 name="フィルター">
                {generalSettings.checkbox.filter.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
            </H2>
        </div>
    );
}
