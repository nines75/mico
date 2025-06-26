import { Settings } from "@/types/storage/settings.types.js";
import { CommonFilter } from "../filter.js";
import { NiconicoVideo } from "@/types/api/recommend.types.js";

export class UserNameFilter extends CommonFilter {
    protected override filter: RegExp[];
    protected override rawFilter: string = this.settings.ngUserName;

    constructor(settings: Settings) {
        super(settings);

        this.filter = this.createFilter();
    }

    protected override getTargetValue(video: NiconicoVideo): string | null {
        return video.owner.name;
    }
}
