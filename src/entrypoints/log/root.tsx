import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { Init } from "./log";
import { AllCommunityModule } from "ag-grid-community";
import { AgGridProvider } from "ag-grid-react";

const modules = [AllCommunityModule];

const dom = document.querySelector("#root");
if (dom !== null) {
  const root = createRoot(dom);
  root.render(
    <StrictMode>
      <AgGridProvider modules={modules}>
        <Init />
      </AgGridProvider>
    </StrictMode>,
  );
}
