import { Settings } from "@/types/storage/settings.types.js";
import { CommonFilter } from "../filter.js";
import { NiconicoVideo } from "@/types/api/recommend.types.js";

export class TitleFilter extends CommonFilter {
    protected override filter: RegExp[];
    protected override rawFilter: string = this.settings.ngTitle;

    constructor(settings: Settings) {
        super(settings);

        this.filter = this.createFilter();
    }

    protected override getTargetValue(video: NiconicoVideo): string {
        return video.title;
    }
}
