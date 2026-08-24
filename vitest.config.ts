import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    dir: "./src",
    setupFiles: "./src/utils/vitest.setup.ts",
    chaiConfig: {
      truncateThreshold: 100, // テスト名などを省略する閾値
    },
  },
});
