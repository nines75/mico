import { videoFilterSettings } from "@/utils/config.js";
import Checkbox from "../ui/Checkbox.js";
import VideoFilterArea from "../ui/VideoFilterArea.js";

export default function VideoFilter() {
    return (
        <section>
            <div className="header-container">
                <h2>動画フィルター</h2>
            </div>
            <div className="settings-container">
                {videoFilterSettings.checkbox.top.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
                <VideoFilterArea />
            </div>
        </section>
    );
}
