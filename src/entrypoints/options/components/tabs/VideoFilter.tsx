import { videoFilterSettings } from "@/utils/config.js";
import VideoFilterArea from "../ui/VideoFilterArea.js";
import CheckboxSection from "../ui/CheckboxSection.js";

export default function VideoFilter() {
    return (
        <div className="settings-container">
            <CheckboxSection groups={videoFilterSettings.checkbox}>
                <VideoFilterArea />
            </CheckboxSection>
        </div>
    );
}
