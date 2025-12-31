import { useStorageStore } from "@/utils/store.js";
import { Info } from "./Info.js";
import type { FilterTab } from "@/types/storage/settings.types.js";

interface ProcessingTimeProps {
    selectedTab: FilterTab;
}

export default function ProcessingTime({ selectedTab }: ProcessingTimeProps) {
    const processingTime = useStorageStore((state) => {
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
                    value={`${processingTime.filtering}ms`}
                />
            )}
            {processingTime?.saveLog !== undefined && (
                <Info name="ログ:" value={`${processingTime.saveLog}ms`} />
            )}
        </>
    );
}
