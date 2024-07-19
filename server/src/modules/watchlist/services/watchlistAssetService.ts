import { AccountProvider } from "src/core/infra/postgres/entities";
import { watchlistAssetRepo } from "../infra";

const findForUser = (userId: string) => watchlistAssetRepo.findForUser(userId);

const createForUser = (
    userId: string,
    provider: AccountProvider,
    contractAddress: string
) => watchlistAssetRepo.createForUser(userId, provider, contractAddress);

const deleteForUser = (
    userId: string,
    provider: AccountProvider,
    contractAddress: string
) => watchlistAssetRepo.deleteForUser(userId, provider, contractAddress);

export const WatchlistAssetService = {
    findForUser,
    createForUser,
    deleteForUser,
};
