import { Relationship, User } from "src/core/infra/postgres/entities";
import { PostgresUserRepository } from "./userRepository";
import { PostgresRelationshipRepository } from "./relationshipRepo";

export const pgUserRepo = new PostgresUserRepository(User);
export const relationshipRepo = new PostgresRelationshipRepository(
    Relationship
);
