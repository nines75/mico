/**
 * https://nvapi.nicovideo.jp/v1/recommend
 */

import { NiconicoVideo } from "./niconico-video.types.js";

export interface RecommendData {
    data: {
        items: {
            id: string;
            contentType: "video" | "mylist";
            content: NiconicoVideo;
        }[];
    };
}
