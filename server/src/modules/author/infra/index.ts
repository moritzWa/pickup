import { Author } from "src/core/infra/postgres/entities/Author/Author";
import { PostgresAuthorRepository } from "./authorRepo";

export const authorRepo = new PostgresAuthorRepository(Author);
