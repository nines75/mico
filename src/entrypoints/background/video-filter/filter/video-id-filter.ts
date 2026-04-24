import type { Settings } from "@/types/storage/settings.types";
import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import { ExactFilter } from "./exact-filter";

export class IdFilter extends ExactFilter {
    constructor(settings: Settings) {
        super(settings, "videoId", "id");
    }

    protected override pickTarget(video: NiconicoVideo): string {
        return video.id;
    }
}
