import { useStorageStore } from "@/utils/store.js";
import { Info } from "./Info.js";

export default function ProcessingTime() {
    const processingTime = useStorageStore((state) => {
        const selectedTab = state.settings.popupSelectedTab;

        switch (selectedTab) {
            case "commentFilter":
                return state.log?.commentFilterLog?.processingTime;
            case "videoFilter":
                return state.log?.videoFilterLog?.processingTime;
        }
    });

    return (
        <>
            {processingTime?.filtering !== undefined && (
                <Info
                    name="フィルタリング:"
                    value={`${processingTime.filtering}ms${
                        processingTime.fetchTag !== undefined &&
                        processingTime.fetchTag !== null
                            ? `(${
                                  processingTime.filtering -
                                  processingTime.fetchTag
                              }ms)`
                            : ""
                    }`}
                />
            )}
            {processingTime?.saveLog !== undefined && (
                <Info name="ログ:" value={`${processingTime.saveLog}ms`} />
            )}
        </>
    );
}
