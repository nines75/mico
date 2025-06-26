import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useStorageStore, storageChangeHandler } from "@/utils/store.js";
import CommentFilterArea from "../options/components/ui/CommentFilterArea.js";

const dom = document.querySelector("#root");
if (dom !== null) {
    const root = createRoot(dom);
    root.render(<Init />);
}

function Init() {
    const isLoading = useStorageStore((state) => state.isLoading);

    useEffect(() => {
        (async () => {
            try {
                await useStorageStore.getState().loadSettingsPageData();
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    if (isLoading) return null;

    return <Page />;
}

function Page() {
    useEffect(() => {
        browser.storage.onChanged.addListener(storageChangeHandler);

        return () => {
            browser.storage.onChanged.removeListener(storageChangeHandler);
        };
    }, []);

    return <CommentFilterArea />;
}
