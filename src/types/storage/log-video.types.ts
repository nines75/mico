import type { NiconicoVideo } from "../api/niconico-video.types";
import type { ProcessingTimeData } from "./log.types";

export interface VideoFilterLog {
    count?: VideoCount;
    filtering?: VideoFiltering;
    processingTime?: ProcessingTimeData;
}

export interface VideoCount {
    totalBlocked: number;
    loaded: number;
    invalid: number;
}

export interface VideoFiltering {
    filteredVideos: FilteredVideo[];
}

export interface FilteredVideo {
    video: NiconicoVideo;
    target: "id" | "owner-id" | "paid" | "views" | "owner-name" | "title";
    id?: string;
    pattern?: string | RegExp;
}
