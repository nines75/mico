import { commentFilterSettings } from "@/utils/config.js";
import CommentFilterArea from "../ui/CommentFilterArea.js";
import CheckboxSection from "../ui/CheckboxSection.js";

export default function CommentFilter() {
    return (
        <div className="settings-container">
            <CheckboxSection groups={commentFilterSettings.checkbox}>
                <CommentFilterArea />
            </CheckboxSection>
        </div>
    );
}
