import type { Settings } from "@/types/storage/settings.types";
import type { Video } from "@/types/api/niconico-video.types";
import { PartialFilter } from "../partial-filter";

export class OwnerNameFilter extends PartialFilter {
    constructor(settings: Settings) {
        super(settings, "videoOwnerName", "owner-name");
    }

    protected override pickTarget(video: Video): string | null {
        return video.owner.name;
    }
}
