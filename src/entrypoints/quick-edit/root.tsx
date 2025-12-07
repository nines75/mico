import { createRoot } from "react-dom/client";
import { Init } from "./quick-edit.js";
import { StrictMode } from "react";

const dom = document.getElementById("root");
if (dom !== null) {
    const root = createRoot(dom);
    root.render(
        <StrictMode>
            <Init />
        </StrictMode>,
    );
}
