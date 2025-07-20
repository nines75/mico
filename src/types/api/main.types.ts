/**
 * https://www.nicovideo.jp/watch/*
 */

import { NiconicoVideo } from "./niconico-video.types.js";

export interface MainData {
    data: {
        response: {
            series: {
                video: {
                    next: NiconicoVideo | null;
                };
            } | null;
            tag: {
                items: {
                    name: string;
                }[];
            } | null;
            video: {
                id: string;
            } | null;
        };
    };
}
