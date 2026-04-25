import type { Settings } from "@/types/storage/settings.types";
import type { Video } from "@/types/api/niconico-video.types";
import { ExactFilter } from "./exact-filter";

export class OwnerIdFilter extends ExactFilter {
    constructor(settings: Settings) {
        super(settings, "videoOwnerId", "owner-id");
    }

    protected override pickTarget(video: Video): string {
        return video.owner.id;
    }
}
