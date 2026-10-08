import type { AutoRule } from "@/entrypoints/background/rule";
import type { Settings } from "@/types/storage/settings.types";
import type { Merge, RenameKeys } from "type-fest";

type SettingsV4 = Merge<
  Settings,
  {
    autoFilter: RenameKeys<
      AutoRule,
      {
        enable: "include";
        disable: "exclude";
        remove: "disable";
      }
    >[];
  }
>;

const directiveMap = {
  "include-tags": "enable-if-tags",
  "include-video-ids": "enable-if-video-ids",
  "include-user-ids": "enable-if-user-ids",
  "include-series-ids": "enable-if-series-ids",
  "exclude-tags": "disable-if-tags",
  "exclude-video-ids": "disable-if-video-ids",
  "exclude-user-ids": "disable-if-user-ids",
  "exclude-series-ids": "disable-if-series-ids",
} as const;

export function migrateSettingsToV5(v4: Partial<SettingsV4>) {
  const autoFilter =
    v4.autoFilter?.map((rule) => {
      // リネームしたプロパティのうちAutoフィルターに存在しえるのはincludeのみ
      const { include, ...rest } = rule;
      if (include === undefined) return rest;

      return { ...rest, enable: include };
    }) ?? [];

  const manualFilter = (v4.manualFilter ?? "")
    .split("\n")
    .map((line) => {
      // @disable => @remove
      if (/^@disable\s*/.test(line)) return "@remove";

      // @include-*/@exclude-* => @enable-if-*/@disable-if-*
      for (const [oldDirective, newDirective] of Object.entries(directiveMap)) {
        if (new RegExp(String.raw`^@${oldDirective}\s`).test(line)) {
          return line.replace(
            new RegExp(`^@${oldDirective}`),
            () => `@${newDirective}`,
          );
        }
      }

      return line;
    })
    .join("\n");

  return { ...v4, autoFilter, manualFilter };
}
