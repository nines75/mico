import { commentFilterSettings } from "@/utils/config.js";
import Checkbox from "../ui/Checkbox.js";
import CommentFilterArea from "../ui/CommentFilterArea.js";
import H2 from "../ui/H2.js";

export default function CommentFilter() {
    return (
        <div className="settings-container">
            {commentFilterSettings.checkbox.top.map((props) => (
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
                <>
                    <H2 name={name} key={key}>
                        {commentFilterSettings.checkbox[key].map((props) => (
                            <Checkbox key={props.id} {...props} />
                        ))}
                    </H2>
                    {key === "filtering" && <CommentFilterArea />}
                </>
            ))}
        </div>
    );
}
