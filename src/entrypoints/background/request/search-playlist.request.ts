import { loadSettings } from "@/utils/storage";
import { filterVideo } from "../video-filter/filter-video";
import { filterResponse } from "./request";
import type { SearchPlaylistApi } from "@/types/api/search-playlist-api.types";
import { searchPlaylistApiSchema } from "@/types/api/search-playlist-api.types";
import { safeParseJson } from "@/utils/util";

export function searchPlaylistRequest(
  details: browser.webRequest._OnBeforeRequestDetails,
) {
  filterResponse(details, "GET", async (filter, encoder, buf) => {
    const settings = await loadSettings();
    const playlistApi: SearchPlaylistApi | undefined = safeParseJson(
      buf,
      searchPlaylistApiSchema,
    );
    if (playlistApi === undefined) return true;

    // フィルタリング対象の動画IDを調べる
    const videos = playlistApi.data.items.map((item) => item.content);
    const result = filterVideo(videos, settings);
    if (result === undefined) return true;

    // 実際にフィルタリング
    playlistApi.data.items = playlistApi.data.items.filter(
      (item) => !result.filteredIds.has(item.watchId),
    );

    filter.write(encoder.encode(JSON.stringify(playlistApi)));
    filter.disconnect();

    return false;
  });
}
