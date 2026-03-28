import type { SetOptional } from "type-fest";

export interface Rule {
    /** 元のフィルターを改行区切りで配列にしたときのインデックス */
    index?: number;
    rule: string | RegExp;
    isStrict: boolean;
    isDisable: boolean;
    include: Toggle;
    exclude: Toggle;
    target: {
        commentUserId: boolean;
        commentCommands: boolean;
        commentBody: boolean;
        videoId: boolean;
        videoOwnerId: boolean;
        videoOwnerName: boolean;
        videoTitle: boolean;
    };
}

export interface Toggle {
    tags: string[][];
    videoIds: string[][];
    userIds: string[][];
    seriesIds: string[][];
}

export function createDefaultRule(): SetOptional<Rule, "rule"> {
    return {
        isStrict: false,
        isDisable: false,
        include: createDefaultToggle(),
        exclude: createDefaultToggle(),
        target: {
            commentUserId: false,
            commentCommands: false,
            commentBody: false,
            videoId: false,
            videoOwnerId: false,
            videoOwnerName: false,
            videoTitle: false,
        },
    };
}

export function createDefaultToggle(): Toggle {
    return {
        tags: [],
        videoIds: [],
        userIds: [],
        seriesIds: [],
    };
}
