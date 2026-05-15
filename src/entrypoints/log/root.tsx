import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { Init } from "./log";
import {
  CellSpanModule,
  ClientSideRowModelModule,
  LocaleModule,
  NumberFilterModule,
  TextFilterModule,
  TooltipModule,
  ValidationModule,
} from "ag-grid-community";
import { AgGridProvider } from "ag-grid-react";

const modules = [
  ClientSideRowModelModule,
  LocaleModule,
  CellSpanModule,
  TooltipModule,
  TextFilterModule,
  NumberFilterModule,
  ...(process.env.NODE_ENV === "production" ? [] : [ValidationModule]),
];

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
