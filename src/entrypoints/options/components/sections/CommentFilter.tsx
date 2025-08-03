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
            <H2 name="フィルタリング">
                {commentFilterSettings.checkbox.filtering.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
                <CommentFilterArea />
            </H2>
            <H2 name="ログ">
                {commentFilterSettings.checkbox.log.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
            </H2>
            <H2 name="通知">
                {commentFilterSettings.checkbox.notification.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
            </H2>
            <H2 name="その他">
                {commentFilterSettings.checkbox.other.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
            </H2>
        </div>
    );
}
