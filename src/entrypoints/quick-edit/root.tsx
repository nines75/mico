import { createRoot } from "react-dom/client";
import { Init } from "./quick-edit.js";
import { StrictMode } from "react";

const dom = document.querySelector("#root");
if (dom !== null) {
    const root = createRoot(dom);
    root.render(
        <StrictMode>
            <Init />
        </StrictMode>,
    );
}
