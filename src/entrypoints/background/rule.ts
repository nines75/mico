import type { Settings } from "@/types/storage/settings.types";
import { merge } from "@/utils/util";
import type { Merge, PartialDeep, SetOptional } from "type-fest";

export interface Rule {
    /** 元のフィルターを改行区切りで配列にしたときのインデックス */
    index?: number;
    id?: string;
    pattern: string | RegExp;
    strict: boolean;
    disable: boolean;
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

interface AutoRuleOnly {
    id: string;
    pattern: string; // 正規表現には対応しない
    source: "dropdown" | "strict" | "contextMenu" | "popup";
    context?: string;
}

export type AutoRule = Merge<PartialDeep<Rule>, AutoRuleOnly>;

export interface Toggle {
    tags: string[][];
    videoIds: string[][];
    userIds: string[][];
    seriesIds: string[][];
}

export function createDefaultRule(): SetOptional<Rule, "pattern"> {
    return {
        strict: false,
        disable: false,
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
    // Manualフィルターを優先して評価するために先に展開
    return [
        ...manualRules.filter((rule) => rule.target[target]),
        ...settings.autoFilter
            .map((rule) => merge(createDefaultRule(), rule) as Rule)
            .filter((rule) => rule.target[target]),
    ];
}
