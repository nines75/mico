import { loadSettings } from "@/utils/storage.js";
import { filterVideo } from "../video-filter/filter-video.js";
import { filterResponse } from "./request.js";
import type { PlaylistFromSearchApi } from "@/types/api/playlist-from-search.types.js";
import { playlistFromSearchApiSchema } from "@/types/api/playlist-from-search.types.js";
import { safeParseJson } from "./safe-parse-json.js";

export function playlistFromSearchRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const settings = await loadSettings();
        const playlistApi: PlaylistFromSearchApi | undefined = safeParseJson(
            buf,
            playlistFromSearchApiSchema,
        );
        if (playlistApi === undefined) return true;

        // フィルタリング対象の動画IDを調べる
        const videos = playlistApi.data.items.map((item) => item.content);
        const filteredData = filterVideo(videos, settings);
        if (filteredData === undefined) return true;

        // 実際にフィルタリング
        playlistApi.data.items = playlistApi.data.items.filter(
            (item) => !filteredData.filteredIds.has(item.watchId),
        );

        filter.write(encoder.encode(JSON.stringify(playlistApi)));
        filter.disconnect();

        return false;
    });
}
