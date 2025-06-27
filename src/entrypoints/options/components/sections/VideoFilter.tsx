import { videoFilterSettings } from "@/utils/config.js";
import Checkbox from "../ui/Checkbox.js";
import VideoFilterArea from "../ui/VideoFilterArea.js";
import H2 from "../ui/H2.js";

export default function VideoFilter() {
    return (
        <H2 name="動画フィルター">
            {videoFilterSettings.checkbox.top.map((props) => (
                <Checkbox key={props.id} {...props} />
            ))}
            <VideoFilterArea />
        </H2>
    );
}
