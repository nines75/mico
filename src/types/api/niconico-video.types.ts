export interface NiconicoVideo {
    id: string;
    title: string;
    registeredAt?: string;
    latestCommentSummary?: string;
    count?: {
        view: number;
        comment: number;
        mylist: number;
        like: number;
    };
    owner?: {
        id: string;
        name: string | null;
        visibility: "visible" | "hidden";
    };
}
