import { CompetitionTokenData } from "./CompetitionTokenData";

export type FullCompetition = {
    id: string;
    name: string;
    token1: CompetitionTokenData;
    token2: CompetitionTokenData;
    createdAt: Date;
};
