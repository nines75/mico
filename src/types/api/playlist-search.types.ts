/**
 * https://nvapi.nicovideo.jp/v1/playlist/search
 */

import { NiconicoVideo } from "./niconico-video.types.js";

export interface PlaylistSearchData {
    data: {
        items: {
            watchId: string;
            content: NiconicoVideo;
        }[];
    };
}
