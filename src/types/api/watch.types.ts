/**
 * https://www.nicovideo.jp/watch/*
 */

import { NiconicoVideo } from "./niconico-video.types.js";

export interface WatchData {
    data: {
        metadata: {
            jsonLds: {
                author?: {
                    name: string;
                    url: string;
                };
            }[];
        };
        // 削除済みの動画のレスポンスで存在しないプロパティはオプショナルにする
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
            channel?: {
                id: string;
                name: string;
            } | null; // チャンネル動画でなければnull
            owner?: {
                id: string;
                nickname: string;
            } | null; // チャンネル動画ならnull
        };
    };
}
