import { defaultSettings } from "@/utils/config";
import { getSettings, loadSettings } from "@/utils/storage";
import { describe, expect, it } from "vitest";
import { setSettings } from "./storage-write";

describe(loadSettings.name, () => {
  it("設定が保存されていない場合、デフォルト設定を返す", async () => {
    expect(await loadSettings()).toEqual(defaultSettings);
  });

  it("設定が保存されている場合、保存された設定をデフォルト設定とマージして返す", async () => {
    await setSettings({ enableCommentFilter: false });

    expect(await loadSettings()).toEqual({
      ...defaultSettings,
      enableCommentFilter: false,
    });
  });
});

describe(getSettings.name, () => {
  it("設定が保存されていない場合、空のオブジェクトを返す", async () => {
    expect(await getSettings()).toEqual({});
  });

  it("設定が保存されている場合、そのまま返す", async () => {
    await setSettings({ enableCommentFilter: false });

    expect(await getSettings()).toEqual({
      enableCommentFilter: false,
      storeId: "",
    });
  });
});
