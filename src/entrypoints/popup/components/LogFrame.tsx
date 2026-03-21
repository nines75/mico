import { Eye, EyeOff } from "lucide-react";
import { InfoContent } from "./Info";
import type { ConditionalPick } from "type-fest";
import type { Settings } from "@/types/storage/settings.types";
import { useStorageStore } from "@/utils/store";
import { useShallow } from "zustand/shallow";
import { titles } from "@/utils/config";

interface LogFrameProps {
    name: string;
    visibleKey: keyof ConditionalPick<Settings, boolean>;
    rule: number | false;
    blocked: number;
    children?: React.ReactNode;
}

export function LogFrame({
    name,
    visibleKey,
    rule,
    blocked,
    children,
}: LogFrameProps) {
    const [isVisible, save] = useStorageStore(
        useShallow((state) => [state.settings[visibleKey], state.saveSettings]),
    );

    const onClick = () => {
        save({ [visibleKey]: !isVisible });
    };

    return (
        <section>
            <div className="filtering-type">
                {isVisible ? (
                    <span className="svg-container" title={titles.hideLog}>
                        <Eye size={30} onClick={onClick} />
                    </span>
                ) : (
                    <span className="svg-container" title={titles.showLog}>
                        <EyeOff size={30} onClick={onClick} />
                    </span>
                )}
                {name}
            </div>
            <div className="info-container">
                {rule !== false && (
                    <InfoContent name="ルール数:" value={rule} />
                )}
                <InfoContent name="ブロック数:" value={blocked} />
            </div>
            {children}
        </section>
    );
}
