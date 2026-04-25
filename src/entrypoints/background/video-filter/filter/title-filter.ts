import type { Settings } from "@/types/storage/settings.types";
import type { Video } from "@/types/api/niconico-video.types";
import { PartialFilter } from "../partial-filter";

export class TitleFilter extends PartialFilter {
    constructor(settings: Settings) {
        super(settings, "videoTitle", "title");
    }

    protected override pickTarget(video: Video): string {
        return video.title;
    }
}
