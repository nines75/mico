import type { Settings } from "@/types/storage/settings.types";

// TODO: #70で削除
export function formatNgId(
    id: string,
    context: string | undefined | null,
    settings: Settings,
) {
    return context !== undefined && context !== null
        ? `# ${context}\n${id}\n`
        : id;
}
