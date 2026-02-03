import { useStorageStore } from "@/utils/store";
import { Info } from "./Info";
import type { FilterTab } from "@/types/storage/settings.types";

interface ProcessingTimeProps {
    selectedTab: FilterTab;
}

export default function ProcessingTime({ selectedTab }: ProcessingTimeProps) {
    const processingTime = useStorageStore((state) => {
        switch (selectedTab) {
            case "commentFilter": {
                return state.log?.commentFilterLog?.processingTime;
            }
            case "videoFilter": {
                return state.log?.videoFilterLog?.processingTime;
            }
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
