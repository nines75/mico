import { PartialDeep } from "type-fest";
import { Settings } from "./settings.types.js";

export interface BackupData {
    settings?: PartialDeep<Settings>;
}
