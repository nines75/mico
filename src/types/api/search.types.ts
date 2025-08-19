/**
 * https://www.nicovideo.jp/search
 * https://www.nicovideo.jp/tag
 */

import { NiconicoVideo } from "./niconico-video.types.js";

export interface SearchData {
    data: {
        response: {
            $getSearchVideoV2: {
                data: {
                    items: NiconicoVideo[];
                };
            };
        };
    };
}
