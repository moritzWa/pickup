import { User } from "src/core/infra/postgres/entities";
import { PostgresUserRepository } from "./userRepository";

export const pgUserRepo = new PostgresUserRepository(User);
