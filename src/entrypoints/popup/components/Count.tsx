import { useStorageStore } from "@/utils/store.js";

export default function Count() {
    const count = useStorageStore((state) => {
        const selectedTab = state.settings.popupSelectedTab;

        switch (selectedTab) {
            case "commentFilter":
                return state.log?.videoData?.count;
            case "videoFilter":
                return state.log?.videoFilterLog?.count;
        }
    });

    const blocked = count?.totalBlocked ?? 0;
    const loaded = count?.loaded ?? 0;
    const percentage = loaded === 0 ? 0 : Math.floor((blocked / loaded) * 100);

    return (
        <>
            <section>
                <span className="info">
                    <span>総ブロック数:</span>
                    <span className="value">{`${blocked}/${loaded} (${percentage}%)`}</span>
                </span>
            </section>
            {count?.invalid !== undefined && count.invalid > 0 && (
                <section>
                    <span className="info">
                        <span>無効なルールの数:</span>
                        <span className="value">{count.invalid}</span>
                    </span>
                </section>
            )}
            {count !== undefined && "include" in count && count.include > 0 && (
                <section>
                    <span className="info">
                        <span>@includeによって有効化されたルールの数:</span>
                        <span className="value">{count.include}</span>
                    </span>
                </section>
            )}
            {count !== undefined && "exclude" in count && count.exclude > 0 && (
                <section>
                    <span className="info">
                        <span>@excludeによって無効化されたルールの数:</span>
                        <span className="value">{count.exclude}</span>
                    </span>
                </section>
            )}
            {count !== undefined && "disable" in count && count.disable > 0 && (
                <section>
                    <span className="info">
                        <span>@disableによって無効化されたコマンドの数:</span>
                        <span className="value">{count.disable}</span>
                    </span>
                </section>
            )}
        </>
    );
}
