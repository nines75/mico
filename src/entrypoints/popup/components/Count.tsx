import { useStorageStore } from "@/utils/store.js";
import { Info } from "./Info.js";
import type { FilterTab } from "@/types/storage/settings.types.js";

interface CountProps {
    selectedTab: FilterTab;
}

export default function Count({ selectedTab }: CountProps) {
    const count = useStorageStore((state) => {
        switch (selectedTab) {
            case "commentFilter":
                return state.log?.commentFilterLog?.count;
            case "videoFilter":
                return state.log?.videoFilterLog?.count;
        }
    });

    const blocked = count?.totalBlocked ?? 0;
    const loaded = count?.loaded ?? 0;
    const percentage = loaded === 0 ? 0 : Math.floor((blocked / loaded) * 100);

    return (
        <>
            <Info
                name="総ブロック数:"
                value={`${blocked}/${loaded} (${percentage}%)`}
            />
            {count?.invalid !== undefined && count.invalid > 0 && (
                <Info name="無効なルールの数:" value={count.invalid} />
            )}
            {count !== undefined && "include" in count && count.include > 0 && (
                <Info
                    name="@includeによって有効化されたルールの数:"
                    value={count.include}
                />
            )}
            {count !== undefined && "exclude" in count && count.exclude > 0 && (
                <Info
                    name="@excludeによって無効化されたルールの数:"
                    value={count.exclude}
                />
            )}
            {count !== undefined && "disable" in count && count.disable > 0 && (
                <Info
                    name="@disableによって無効化されたコマンドの数:"
                    value={count.disable}
                />
            )}
        </>
    );
}
