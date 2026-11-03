export interface Tab {
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
