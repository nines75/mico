/*
    https://nvapi.nicovideo.jp/v1/recommend
*/

export interface RecommendDataContainer {
    data: RecommendData;
}

export interface RecommendData {
    items: RecommendItem[];
}

export interface RecommendItem {
    id: string;
    contentType: "video" | "mylist";
    content: NiconicoVideo;
}

export interface NiconicoVideo {
    id: string;
    title: string;
    registeredAt: string;
    latestCommentSummary: string;
    count: {
        view: number;
        comment: number;
        mylist: number;
        like: number;
    };
    owner: {
        id: string;
        name: string;
        visibility: string;
    };
}
