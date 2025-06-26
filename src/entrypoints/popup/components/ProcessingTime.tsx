import { useStorageStore } from "@/utils/store.js";

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
                <section>
                    <span className="info">
                        <span>フィルタリング:</span>
                        <span className="value">
                            {processingTime.filtering}ms
                            {processingTime.fetchTag !== undefined &&
                                processingTime.fetchTag !== null &&
                                `(${
                                    processingTime.filtering -
                                    processingTime.fetchTag
                                }ms)`}
                        </span>
                    </span>
                </section>
            )}
            {processingTime?.saveLog !== undefined && (
                <section>
                    <span className="info">
                        <span>ログ:</span>
                        <span className="value">
                            {processingTime.saveLog}ms
                        </span>
                    </span>
                </section>
            )}
        </>
    );
}
