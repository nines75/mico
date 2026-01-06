import type { Settings } from "@/types/storage/settings.types";
import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import { PartialFilter } from "../partial-filter";

export class TitleFilter extends PartialFilter {
    constructor(settings: Settings) {
        super(settings, settings.ngTitle);
    }

    protected override pickTarget(video: NiconicoVideo): string {
        return video.title;
    }
}
