/**
 * https://www.nicovideo.jp/watch/*
 */

import { NiconicoVideo } from "./niconico-video.types.js";

export interface MainData {
    data: {
        metadata: {
            jsonLds: {
                author?: {
                    name: string;
                    url: string;
                };
            }[];
        };
        response: {
            series?: {
                video: {
                    next: NiconicoVideo | null;
                };
            } | null; // シリーズに登録されていなければnull
            tag?: {
                items: {
                    name: string;
                }[];
            };
            video?: {
                id: string;
                title: string;
            };
        };
    };
}
