import { useStorageStore } from "@/utils/store.js";

export default function ProcessingTime() {
    const processingTime = useStorageStore(
        (state) => state.log?.processingTime
    );

    return (
        <>
            {processingTime?.filtering !== undefined && (
                <section>
                    <span className="info">
                        <span>フィルタリング:</span>
                        <span className="value">
                            {processingTime.filtering}ms
                            {processingTime.fetchTag !== undefined &&
                                processingTime.fetchTag !== -1 &&
                                `(${
                                    processingTime.filtering -
                                    processingTime.fetchTag
                                }ms)`}
                        </span>
                    </span>
                </section>
            )}
            {processingTime?.saveVideoLog !== undefined && (
                <section>
                    <span className="info">
                        <span>ログ:</span>
                        <span className="value">
                            {processingTime.saveVideoLog}ms
                        </span>
                    </span>
                </section>
            )}
        </>
    );
}
