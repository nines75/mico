import type { Settings } from "@/types/storage/settings.types";
import { customMerge } from "@/utils/util";
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

// 特有のプロパティを取り出したいのでRuleを継承しない
export interface AutoRuleOnly {
    id: string;
    source: "dropdown" | "strict" | "contextMenu";
    context?: string;
}

export type AutoRule = AutoRuleOnly & Rule;

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

export function createRules(
    settings: Settings,
    target: keyof Rule["target"],
    manualRules: Rule[],
) {
    // manualルールを優先して評価するために先に展開
    return [
        ...manualRules.filter((rule) => rule.target[target]),
        ...settings.autoFilter
            .map((rule) => customMerge(createDefaultRule(), rule) as Rule)
            .filter((rule) => rule.target[target]),
    ];
}
