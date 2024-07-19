import {
    CategoryEntry,
    Token,
    TokenPermission,
} from "src/core/infra/postgres/entities";
import { PostgresTokenRepository } from "./tokenRepository";
import { PostgresTokenPermissionRepository } from "./tokenPermissionRepo";

export const pgTokenRepo = new PostgresTokenRepository(Token);
export const pgTokenPermissionRepo = new PostgresTokenPermissionRepository(
    TokenPermission
);
