/*
    https://nvapi.nicovideo.jp/v1/recommend
*/

export interface RecommendDataContainer {
    data: RecommendData;
}

interface RecommendData {
    items: RecommendItem[];
}

interface RecommendItem {
    id: string;
    contentType: "video" | "mylist";
    content: RecommendContent;
}

interface RecommendContent {
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
