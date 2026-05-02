import { loadSettings } from "@/utils/storage";
import { describe, expect, it } from "vitest";
import { addAutoRule, removeAutoRule, setSettings } from "./storage-write";
import type { AutoRule } from "@/entrypoints/background/rule";

const expectString = expect.any(String) as string;

describe(addAutoRule.name, () => {
  it.each([
    {
      name: "0",
      rules: [],
    },
    {
      name: "1",
      rules: [
        {
          pattern: "rule",
          source: "dropdown",
        },
      ],
    },
    {
      name: "複数",
      rules: [
        {
          pattern: "rule",
          source: "dropdown",
        },
        {
          pattern: "rule",
          source: "contextMenu",
          target: { commentBody: true },
        },
      ],
    },
  ] satisfies { name: string; rules: Parameters<typeof addAutoRule>[0] }[])(
    "ルール数: $name",
    async ({ rules }) => {
      await addAutoRule(rules);

      const settings = await loadSettings();
      expect(settings.autoFilter).toEqual(
        rules.map((rule) => ({
          id: expectString,
          ...rule,
        })),
      );
    },
  );
});

describe(removeAutoRule.name, () => {
  it.each([
    {
      name: "0",
      rules: [],
    },
    {
      name: "1",
      rules: [
        {
          id: "id",
          pattern: "rule",
          source: "dropdown",
        },
      ],
    },
    {
      name: "複数",
      rules: [
        {
          id: "id",
          pattern: "rule",
          source: "dropdown",
        },
        {
          id: "id2",
          pattern: "rule",
          source: "contextMenu",
          target: { commentBody: true },
        },
      ],
    },
  ] satisfies { name: string; rules: AutoRule[] }[])(
    "ルール数: $name",
    async ({ rules }) => {
      await setSettings({ autoFilter: rules });
      await removeAutoRule(rules.map(({ id }) => id));

      const settings = await loadSettings();
      expect(settings.autoFilter).toEqual([]);
    },
  );
});
