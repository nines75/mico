/**
 * https://www.nicovideo.jp/ranking/genre
 */

import { NiconicoVideo } from "./niconico-video.types.js";

export interface RankingData {
    data: {
        response: {
            $getTeibanRanking: {
                data: {
                    items: NiconicoVideo[];
                };
            };
        };
    };
}
