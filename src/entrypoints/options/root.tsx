// -------------------------------------------------------------------------------------------
// 開発環境でcreateRoot()が重複して呼び出されないようにコンポーネントを別のファイルで定義する
// -------------------------------------------------------------------------------------------

import { createRoot } from "react-dom/client";
import { Init } from "./settings";
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
