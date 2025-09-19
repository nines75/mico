import { generalSettings } from "@/utils/config.js";
import Checkbox from "../ui/Checkbox.js";
import H2 from "../ui/H2.js";

export default function General() {
    return (
        <div className="settings-container">
            <H2 name="フィルタリング">
                {generalSettings.checkbox.filtering.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
            </H2>
            <H2 name="エディター">
                {generalSettings.checkbox.editor.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
            </H2>
        </div>
    );
}
