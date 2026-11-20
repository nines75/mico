import path from "node:path";
import { globSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { defineWxtModule, addViteConfig } from "wxt/modules";

interface License {
  name: string;
  version: string;
  identifier: string;
  text?: string;
}

export default defineWxtModule({
  setup(wxt) {
    if (wxt.config.mode !== "production") return;

    addViteConfig(wxt, () => ({
      build: {
        license: {
          fileName: `license-${crypto.randomUUID()}.json`,
        },
      },
    }));

    wxt.hook("build:done", () => {
      const outDir = wxt.config.outDir;
      const files = globSync(path.join(outDir, "license-*.json"));

      const packages = new Set<string>();

      let data = "";
      for (const file of files) {
        const text = readFileSync(file, "utf8");
        const licenses = JSON.parse(text) as License[];

        for (const license of licenses) {
          data += formatLicense(license, packages);
        }

        rmSync(file);
      }

      writeFileSync(path.join(outDir, "third-party-notices.txt"), data);
    });
  },
});

type LicenseType = "webext-core" | "wxt";

const licenseMap: Record<string, LicenseType> = {
  // webext-core
  "@webext-core/messaging": "webext-core",
  "@webext-core/proxy-service": "webext-core",

  // wxt
  "@wxt-dev/browser": "wxt",
  "@wxt-dev/storage": "wxt",
  wxt: "wxt",
} as const;

const licenseText = {
  "webext-core": `MIT License\n\nCopyright (c) 2022 Aaron\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.`,
  wxt: `MIT License\n\nCopyright (c) 2023 Aaron\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.`,
} as const satisfies Record<LicenseType, string>;

function formatLicense(license: License, packages: Set<string>) {
  const { name, version, identifier } = license;

  const id = `${name}@${version}`;
  if (packages.has(id)) return "";

  packages.add(id);

  if (license.text === undefined) {
    const type = licenseMap[name];
    if (type === undefined) {
      throw new Error(`${name}のライセンスが定義されていません`);
    }

    license.text = licenseText[type];
  }

  return `${name} - ${version} (${identifier})\n\n${license.text}\n\n---\n\n`;
}
