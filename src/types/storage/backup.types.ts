import type { Settings } from "./settings.types.js";

export interface BackupData {
    settings?: Partial<Settings>;
}
