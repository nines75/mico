import type { Settings } from "@/types/storage/settings.types.js";
import { PartialFilter } from "../filter.js";
import type { NiconicoVideo } from "@/types/api/niconico-video.types.js";

export class UserNameFilter extends PartialFilter {
    constructor(settings: Settings) {
        super(settings, settings.ngUserName);
    }

    protected override pickTarget(video: NiconicoVideo): string | null {
        return video.owner?.name ?? null;
    }
}
