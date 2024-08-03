type Maybe<T> = T | null;

export interface LinkViewResponse {
    link: {
        id: number;
        link: string;
        title: string;
        favorite: boolean;
        snippet: string;
        metadata?: {
            full_text?: string;
            author?: string;
            page_type?: string;
        };
        createdDate: string | null;
        modifiedDate: string;
        lastCrawled: string | null;
        userIds: number[];
        readCount: number;
        users: (User & { savedDate: string })[];
        comments: Comment[];
        highlights: FullHighlight[][];
    };
}

export interface User {
    // Basic user metadata
    id: number;
    firstName: string;
    lastName: string;
    userLink: string;
    lastOnline: Date;
}

export interface Mention {
    fromUid: number;
    toUid: number;
    linkId: number;
    user: User;
    highlightId?: number;
    createdDate: Date;
}

export interface Highlight {
    id: number;
    userId: number;
    linkId: number;
    highlight: string;
    createdDate: Date;
    position: any;
    verified?: boolean;
    leftContext: string;
    rightContext: string;
    rawHighlight: string;
}

export interface FullHighlight extends Highlight {
    comment: Maybe<Comment>;
    mentions: Mention[];
    user: User;
}
