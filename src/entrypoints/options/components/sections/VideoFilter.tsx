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
            {(
                [
                    ["フィルタリング", "filtering"],
                    ["ログ", "log"],
                    ["通知", "notification"],
                    ["その他", "other"],
                ] as const
            ).map(([name, key]) => (
                <H2 name={name} key={key}>
                    {videoFilterSettings.checkbox[key].map((props) => (
                        <Checkbox key={props.id} {...props} />
                    ))}
                    {key === "filtering" && <VideoFilterArea />}
                </H2>
            ))}
        </div>
    );
}
