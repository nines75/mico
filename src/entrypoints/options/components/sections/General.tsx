import { generalSettings } from "@/utils/config.js";
import Checkbox from "../ui/Checkbox.js";
import H2 from "../ui/H2.js";
import H3 from "../ui/H3.js";

export default function General() {
    return (
        <H2 name="一般設定">
            <H3 name="フィルター">
                {generalSettings.checkbox.filter.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
            </H3>
            <H3 name="ログ">
                {generalSettings.checkbox.log.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
            </H3>
        </H2>
    );
}
