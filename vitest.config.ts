import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing";

export default defineConfig({
    plugins: [WxtVitest()],
    test: {
        dir: "./src",
        setupFiles: "./src/utils/vitest.setup.ts",
    },
});
