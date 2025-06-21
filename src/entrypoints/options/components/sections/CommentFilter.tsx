import { commentFilterSettings } from "@/utils/config.js";
import Checkbox from "../ui/Checkbox.js";
import FilterArea from "../ui/FilterArea.js";

export default function CommentFilter() {
    return (
        <section>
            <div className="header-container">
                <h2>コメントフィルター</h2>
            </div>
            <div className="settings-container">
                {commentFilterSettings.checkbox.top.map((props) => (
                    <Checkbox key={props.id} {...props} />
                ))}
                <section>
                    <div className="header-container">
                        <h3>フィルタリング</h3>
                    </div>
                    <div className="settings-container">
                        {commentFilterSettings.checkbox.filtering.map(
                            (props) => (
                                <Checkbox key={props.id} {...props} />
                            ),
                        )}
                        <FilterArea />
                    </div>
                </section>
                <section>
                    <div className="header-container">
                        <h3>ログ</h3>
                    </div>
                    <div className="settings-container">
                        {commentFilterSettings.checkbox.log.map((props) => (
                            <Checkbox key={props.id} {...props} />
                        ))}
                    </div>
                </section>
                <section>
                    <div className="header-container">
                        <h3>通知</h3>
                    </div>
                    <div className="settings-container">
                        {commentFilterSettings.checkbox.notification.map(
                            (props) => (
                                <Checkbox key={props.id} {...props} />
                            ),
                        )}
                    </div>
                </section>
                <section>
                    <div className="header-container">
                        <h3>その他</h3>
                    </div>
                    <div className="settings-container">
                        {commentFilterSettings.checkbox.other.map((props) => (
                            <Checkbox key={props.id} {...props} />
                        ))}
                    </div>
                </section>
            </div>
        </section>
    );
}
