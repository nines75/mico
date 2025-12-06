import { createRoot } from "react-dom/client";
import { Init } from "./popup.js";

const dom = document.querySelector("#root");
if (dom !== null) {
    const root = createRoot(dom);
    root.render(<Init />);
}
