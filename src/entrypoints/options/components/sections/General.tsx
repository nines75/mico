import { generalSettings } from "@/utils/config.js";
import Checkbox from "../ui/Checkbox.js";

export default function General() {
    return (
        <section>
            <div className="header-container">
                <h2>一般設定</h2>
            </div>
            <div className="settings-container">
                <section>
                    <div className="header-container">
                        <h3>フィルター</h3>
                    </div>
                    <div className="settings-container">
                        {generalSettings.checkbox.filter.map((props) => (
                            <Checkbox key={props.id} {...props} />
                        ))}
                    </div>
                </section>
                <section>
                    <div className="header-container">
                        <h3>ログ</h3>
                    </div>
                    <div className="settings-container">
                        {generalSettings.checkbox.log.map((props) => (
                            <Checkbox key={props.id} {...props} />
                        ))}
                    </div>
                </section>
            </div>
        </section>
    );
}
