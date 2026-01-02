import type { SetOptional } from "type-fest";

export interface Rule {
    /** 元のフィルターを改行区切りで配列にしたときのインデックス */
    index?: number;
    rule: string | RegExp;
    isStrict: boolean;
    isDisable: boolean;
    include: Toggle;
    exclude: Toggle;
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
