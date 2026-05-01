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

    const result = filterVideo(
      playlistApi.data,
      (item) => item.content,
      settings,
    );
    if (result === undefined) return true;

    filter.write(encoder.encode(JSON.stringify(playlistApi)));
    filter.disconnect();

    return false;
  });
}
