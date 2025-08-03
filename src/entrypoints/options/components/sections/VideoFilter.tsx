import { videoFilterSettings } from "@/utils/config.js";
import Checkbox from "../ui/Checkbox.js";
import VideoFilterArea from "../ui/VideoFilterArea.js";
import H2 from "../ui/H2.js";

export default function VideoFilter() {
    return (
        <div className="settings-container">
            {videoFilterSettings.checkbox.top.map((props) => (
                <Checkbox key={props.id} {...props} />
            ))}
            <H2 name="フィルタリング">
                {videoFilterSettings.checkbox.filtering.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
                <VideoFilterArea />
            </H2>
            <H2 name="その他">
                {videoFilterSettings.checkbox.other.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
            </H2>
        </div>
    );
}
