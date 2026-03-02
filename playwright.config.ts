import { defineConfig, devices } from "@playwright/test";

const isCi = process.env.CI === "true";

// https://playwright.dev/docs/test-configuration
export default defineConfig({
    testDir: "./tests",
    fullyParallel: true, // ファイル内のテストを並列実行
    forbidOnly: isCi, // CIでのみtest.onlyを禁止
    retries: isCi ? 2 : 0, // CIでのみリトライ
    projects: [
        {
            name: "firefox",
            use: devices["Desktop Firefox"],
        },
    ],
});
