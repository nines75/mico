import type { Settings } from "@/types/storage/settings.types";

export function formatNgId(
    id: string,
    context: string | undefined | null,
    settings: Settings,
) {
    return settings.isNgContextAppendedOnAdd &&
        context !== undefined &&
        context !== null
        ? `# ${context}\n${id}\n`
        : id;
}
