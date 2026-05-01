import type { Settings } from "@/types/storage/settings.types";
import type { Video } from "@/types/api/video.types";
import type { FilteredVideo } from "@/types/storage/log.types";

export interface ApplyParams<T> {
  data: { items: T[] };
  pickVideo: (item: T) => Video | undefined;
}

export abstract class Filter {
  protected settings: Settings;
  protected filteredVideos: FilteredVideo[] = [];

  constructor(settings: Settings) {
    this.settings = settings;
  }

  abstract apply<T>(params: ApplyParams<T>): void;

  getFilteredVideos() {
    return this.filteredVideos;
  }

  protected traverseVideos<T>(
    { data, pickVideo }: ApplyParams<T>,
    callback: (video: Video) => boolean,
  ) {
    data.items = data.items.filter((item) => {
      const video = pickVideo(item);
      if (video === undefined) return true;

      return callback(video);
    });
  }
}
