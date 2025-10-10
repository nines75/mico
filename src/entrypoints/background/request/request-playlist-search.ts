import { loadSettings } from "@/utils/storage.js";
import { filterVideo } from "../video-filter/filter-video.js";
import { filterResponse } from "./request.js";
import {
    PlaylistSearchData,
    playlistSearchSchema,
} from "@/types/api/playlist-search.types.js";
import { safeParseJson } from "@/utils/util.js";

export function playlistSearchRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const settings = await loadSettings();
        const data: PlaylistSearchData | undefined = safeParseJson(
            buf,
            playlistSearchSchema,
        );
        if (data === undefined) return true;

        // フィルタリング対象の動画IDを調べる
        const videos = data.data.items.map((item) => item.content);
        const filteredData = filterVideo(videos, settings);
        if (filteredData === undefined) return true;

        // 実際にフィルタリング
        data.data.items = data.data.items.filter(
            (item) => !filteredData.filteredIds.has(item.watchId),
        );

        filter.write(encoder.encode(JSON.stringify(data)));
        filter.disconnect();

        return false;
    });
}
