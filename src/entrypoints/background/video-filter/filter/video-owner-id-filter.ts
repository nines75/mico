import type { Settings } from "@/types/storage/settings.types";
import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import type { CommonLog } from "@/types/storage/log.types";
import { ExactFilter } from "./exact-filter";

export class VideoOwnerIdFilter extends ExactFilter<CommonLog> {
    protected override log: CommonLog = new Map();

    constructor(settings: Settings) {
        super(settings, "videoOwnerId");
    }

    protected override pickTarget(video: NiconicoVideo): string {
        return video.owner.id;
    }
}
