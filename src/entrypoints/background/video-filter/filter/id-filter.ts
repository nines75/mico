import type { Settings } from "@/types/storage/settings.types";
import type { Video } from "@/types/api/video.types";
import { ExactFilter } from "./exact-filter";

export class IdFilter extends ExactFilter {
    constructor(settings: Settings) {
        super(settings, "videoId", "id");
    }

    protected override pickTarget(video: Video): string {
        return video.id;
    }
}
