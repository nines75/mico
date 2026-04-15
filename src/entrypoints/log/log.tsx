import { useEffect } from "react";
import { useStorageStore } from "@/utils/store";

export function Init() {
    const isLoading = useStorageStore((state) => state.isLoading);

    useEffect(() => {
        useStorageStore.getState().loadLog();
    }, []);

    if (isLoading) return null;

    return <Page />;
}

function Page() {
    return <></>;
}
