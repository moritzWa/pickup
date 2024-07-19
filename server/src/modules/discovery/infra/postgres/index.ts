import { BlacklistToken } from "src/core/infra/postgres/entities";
import { PostgresBlacklistTokenRepository } from "./blacklistTokenRepo";

export const blacklistTokenEntryRepo = new PostgresBlacklistTokenRepository(
    BlacklistToken
);
