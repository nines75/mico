import { OwnerNameFilter } from "./filter/owner-name-filter";
import { TitleFilter } from "./filter/title-filter";
import type { Settings } from "@/types/storage/settings.types";
import { PaidFilter } from "./filter/paid-filter";
import { ViewCountFilter } from "./filter/view-count-filter";
import { IdFilter } from "./filter/id-filter";
import { OwnerIdFilter } from "./filter/owner-id-filter";
import type { ApplyParams } from "./filter";

export type Filters = FilteringResult["filters"];

export interface FilteringResult {
  filters: {
    idFilter: IdFilter;
    ownerIdFilter: OwnerIdFilter;
    paidFilter: PaidFilter;
    viewCountFilter: ViewCountFilter;
    ownerNameFilter: OwnerNameFilter;
    titleFilter: TitleFilter;
  };
  loadedVideoCount: number;
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

  const idFilter = new IdFilter(settings);
  const ownerIdFilter = new OwnerIdFilter(settings);
  const paidFilter = new PaidFilter(settings);
  const viewCountFilter = new ViewCountFilter(settings, forRecommendApi);
  const ownerNameFilter = new OwnerNameFilter(settings);
  const titleFilter = new TitleFilter(settings);

  const filters: Filters = {
    idFilter,
    ownerIdFilter,
    paidFilter,
    viewCountFilter,
    ownerNameFilter,
    titleFilter,
  };

  for (const filter of Object.values(filters)) {
    filter.apply({ data, pickVideo });
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
  };
}
