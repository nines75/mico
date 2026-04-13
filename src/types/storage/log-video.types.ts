import type { NiconicoVideo } from "../api/niconico-video.types";

export interface VideoFilterLog {
    filtering?: VideoFiltering;
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
