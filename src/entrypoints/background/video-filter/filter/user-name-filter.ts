import type { Settings } from "@/types/storage/settings.types";
import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import { PartialFilter } from "../partial-filter";

export class UserNameFilter extends PartialFilter {
    constructor(settings: Settings) {
        super(settings, settings.ngUserName);
    }

    protected override pickTarget(video: NiconicoVideo): string | null {
        return video.owner?.name ?? null;
    }
}
