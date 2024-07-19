import {
    Relationship,
    FavoriteMemecoin,
} from "src/core/infra/postgres/entities";
import { PostgresRelationshipRepository } from "./relationshipRepo";
import { PostgresFavoriteMemecoinRepository } from "./favoriteMemecoinRepo";

export const pgRelationshipRepo = new PostgresRelationshipRepository(
    Relationship
);

export const pgFavoriteMemecoinRepo = new PostgresFavoriteMemecoinRepository(
    FavoriteMemecoin
);
