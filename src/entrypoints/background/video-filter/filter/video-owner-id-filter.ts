import type { Settings } from "@/types/storage/settings.types";
import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import { ExactFilter } from "./exact-filter";

export class VideoOwnerIdFilter extends ExactFilter {
    constructor(settings: Settings) {
        super(settings, "videoOwnerId", "owner-id");
    }

    protected override pickTarget(video: NiconicoVideo): string {
        return video.owner.id;
    }
}
