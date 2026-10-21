import type { Video } from "../api/video.types";

export interface Tab {
  seriesNext: Video | undefined;

  watchLazyDone: boolean;

  playbackTime?: number;
  duration: number;

  logId?: string;
  videoId: string;
  seriesId: string | undefined;
  title: string;
  ownerId: string | undefined;
  ownerName: string | undefined;
  tags: string[];
}
