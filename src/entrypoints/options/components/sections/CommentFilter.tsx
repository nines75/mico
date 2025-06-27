import { commentFilterSettings } from "@/utils/config.js";
import Checkbox from "../ui/Checkbox.js";
import CommentFilterArea from "../ui/CommentFilterArea.js";
import H2 from "../ui/H2.js";
import H3 from "../ui/H3.js";

export default function CommentFilter() {
    return (
        <H2 name="コメントフィルター">
            {commentFilterSettings.checkbox.top.map((props) => (
                <Checkbox key={props.id} {...props} />
            ))}
            <H3 name="フィルタリング">
                {commentFilterSettings.checkbox.filtering.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
                <CommentFilterArea />
            </H3>
            <H3 name="ログ">
                {commentFilterSettings.checkbox.log.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
            </H3>
            <H3 name="通知">
                {commentFilterSettings.checkbox.notification.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
            </H3>
            <H3 name="その他">
                {commentFilterSettings.checkbox.other.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
            </H3>
        </H2>
    );
}
