export type CategoryToken = {
    name: string;
    contractAddress: string;
    twitter?: string;
    website?: string;
    verified: boolean;
};

export type Category = {
    tokens: CategoryToken[];
    name: string;
};
