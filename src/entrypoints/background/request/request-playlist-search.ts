import { loadSettings } from "@/utils/storage.js";
import { filterVideo } from "../video-filter/filter-video.js";
import { filterResponse } from "./request.js";
import { PlaylistSearchData } from "@/types/api/playlist-search.types.js";

export function playlistSearchRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const settings = await loadSettings();
        const data = JSON.parse(buf) as PlaylistSearchData;

        // フィルタリング対象の動画IDを調べる
        const videos = data.data.items.map((item) => item.content);
        const filteredData = filterVideo(videos, settings);

        // 実際にフィルタリング
        if (filteredData !== undefined) {
            data.data.items = data.data.items.filter(
                (item) => !filteredData.filteredIds.has(item.watchId),
            );
        }

        filter.write(encoder.encode(JSON.stringify(data)));
        filter.disconnect();
    });
}
