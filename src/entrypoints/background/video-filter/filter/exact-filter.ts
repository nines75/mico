import type { Settings } from "@/types/storage/settings.types";
import { isString } from "@/utils/util";
import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import { RuleFilter } from "../rule-filter";
import type { Rule } from "../../rule";

export abstract class ExactFilter<T> extends RuleFilter<T> {
    private ids = new Set<string>();
    private regexes: RegExp[] = [];

    constructor(settings: Settings, target: keyof Rule["target"]) {
        super(settings, target);

        // Setを複数箇所で使うため予め生成
        for (const rule of this.rules.map((item) => item.rule)) {
            if (isString(rule)) {
                this.ids.add(rule);
            } else {
                this.regexes.push(rule);
            }
        }
    }

    protected abstract pickTarget(video: NiconicoVideo): string;

    override filtering(data: { videos: NiconicoVideo[] }): void {
        data.videos = data.videos.filter((video) => {
            const target = this.pickTarget(video);

            // TODO: comment-user-idと同様に正規表現ルールの評価は後から行うように変更する
            const regexRule = this.regexes.find((regex) => regex.test(target));
            if (this.ids.has(target) || regexRule !== undefined) {
                // TODO: ログは#70で実装
                this.filteredVideos.set(video.id, video);
                this.blockedCount++;

                return false;
            }

            return true;
        });
    }

    override isNgVideo(video: NiconicoVideo): boolean {
        const target = this.pickTarget(video);

        if (
            this.ids.has(target) ||
            this.regexes.some((regex) => regex.test(target))
        ) {
            return true;
        }

        return false;
    }

    override sortLog(): void {
        // TODO: #70で廃止
    }
}
