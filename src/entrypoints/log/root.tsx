import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { Init } from "./log";

const dom = document.querySelector("#root");
if (dom !== null) {
    const root = createRoot(dom);
    root.render(
        <StrictMode>
            <Init />
        </StrictMode>,
    );
}
