import type { Settings } from "@/types/storage/settings.types.js";
import { PartialFilter } from "../filter.js";
import type { NiconicoVideo } from "@/types/api/niconico-video.types.js";

export class TitleFilter extends PartialFilter {
    constructor(settings: Settings) {
        super(settings, settings.ngTitle);
    }

    protected override pickTarget(video: NiconicoVideo): string {
        return video.title;
    }
}
