import { OwnerNameFilter } from "./filter/owner-name-filter";
import { TitleFilter } from "./filter/title-filter";
import type { Settings } from "@/types/storage/settings.types";
import { PaidFilter } from "./filter/paid-filter";
import { ViewCountFilter } from "./filter/view-count-filter";
import { IdFilter } from "./filter/id-filter";
import { OwnerIdFilter } from "./filter/owner-id-filter";
import type { ApplyParams } from "./filter";
import type { Video } from "@/types/api/video.types";
import { ShortsFilter } from "./filter/shorts-filter";

export type Filters = FilteringResult["filters"];

export interface FilteringResult {
  filters: {
    idFilter: IdFilter;
    ownerIdFilter: OwnerIdFilter;
    paidFilter: PaidFilter;
    shortsFilter: ShortsFilter;
    viewCountFilter: ViewCountFilter;
    ownerNameFilter: OwnerNameFilter;
    titleFilter: TitleFilter;
  };
  loadedVideoCount: number;
  allVideos: Video[];
}

export function filterVideo<T>(
  data: ApplyParams<T>["data"],
  pickVideo: ApplyParams<T>["pickVideo"],
  settings: Settings,
  forRecommendApi = false,
): FilteringResult | undefined {
  if (!settings.enableVideoFilter) return;

  const loadedVideoCount = data.items
    .map((item) => pickVideo(item))
    .filter((video) => video !== undefined).length;

  const allVideos = data.items
    .map((item) => pickVideo(item))
    .filter((video) => video !== undefined);

  const shorts = data.items.filter(
    (item) => pickVideo(item)?.contentType === "short",
  );

  const idFilter = new IdFilter(settings);
  const ownerIdFilter = new OwnerIdFilter(settings);
  const paidFilter = new PaidFilter(settings);
  const shortsFilter = new ShortsFilter(settings, forRecommendApi);
  const viewCountFilter = new ViewCountFilter(settings, forRecommendApi);
  const ownerNameFilter = new OwnerNameFilter(settings);
  const titleFilter = new TitleFilter(settings);

  const filters: Filters = {
    idFilter,
    ownerIdFilter,
    paidFilter,
    shortsFilter,
    viewCountFilter,
    ownerNameFilter,
    titleFilter,
  };

  for (const filter of Object.values(filters)) {
    filter.apply({ data, pickVideo });
  }

  // レコメンドAPIのショート動画は一つでもレスポンスから除去するとすべてのショート動画がレンダリングされなくなる
  // これを回避するために一度除去したあとisMutedプロパティをtrueにして再度追加する
  if (
    forRecommendApi &&
    !settings.enableShortsFilter &&
    // すべてのショート動画がフィルタリングされたときisMutedプロパティをtrueにすると枠が残ってしまうためここで弾く
    data.items.some((item) => pickVideo(item)?.contentType === "short")
  ) {
    for (const short of shorts) {
      const video = pickVideo(short);
      if (video === undefined) continue;

      // フィルタリングされなかった場合は何もしない
      if (data.items.some((item) => pickVideo(item)?.id === video.id)) continue;

      video.isMuted = true;
      data.items.push(short);
    }
  }

  if (settings.hideCommentPreview) {
    for (const item of data.items) {
      const video = pickVideo(item);
      if (video === undefined) continue;

      video.latestCommentSummary = "";
    }
  }

  return {
    filters,
    loadedVideoCount,
    allVideos,
  };
}
