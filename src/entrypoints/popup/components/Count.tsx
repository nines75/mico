import { useStorageStore } from "@/utils/store.js";

export default function Count() {
    const count = useStorageStore((state) => state.log?.videoData?.count);

    const blocked = count?.blocked ?? 0;
    const loaded = count?.loaded ?? 0;
    const percentage = loaded === 0 ? 0 : Math.floor((blocked / loaded) * 100);

    return (
        <>
            {count?.include !== undefined && count.include > 0 && (
                <section>
                    <span className="info">
                        <span>@includeによって有効化されたルールの数:</span>
                        <span className="value">{count.include}</span>
                    </span>
                </section>
            )}
            {count?.exclude !== undefined && count.exclude > 0 && (
                <section>
                    <span className="info">
                        <span>@excludeによって無効化されたルールの数:</span>
                        <span className="value">{count.exclude}</span>
                    </span>
                </section>
            )}
            {count?.disable !== undefined && count.disable > 0 && (
                <section>
                    <span className="info">
                        <span>@disableによって無効化されたコマンドの数:</span>
                        <span className="value">{count.disable}</span>
                    </span>
                </section>
            )}
            <section>
                <span className="info">
                    <span>総ブロック数:</span>
                    <span className="value">{`${blocked}/${loaded} (${percentage}%)`}</span>
                </span>
            </section>
        </>
    );
}
