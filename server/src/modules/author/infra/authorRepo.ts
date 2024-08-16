import { dataSource } from "src/core/infra/postgres";
import { Author } from "src/core/infra/postgres/entities/Author/Author";
import {
    failure,
    FailureOrSuccess,
    NotFoundError,
    success,
    UnexpectedError,
} from "src/core/logic";
import { DefaultErrors } from "src/core/logic/errors/default";
import { Helpers } from "src/utils";
import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    Repository,
} from "typeorm";

type AuthorResponse = FailureOrSuccess<DefaultErrors, Author>;
type AuthorArrayResponse = FailureOrSuccess<DefaultErrors, Author[]>;

export class PostgresAuthorRepository {
    constructor(private model: typeof Author) {}

    private get repo(): Repository<Author> {
        return dataSource.getRepository(this.model);
    }

    async find(options: FindManyOptions<Author>): Promise<AuthorArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    findForName = async (name: string): Promise<AuthorResponse> => {
        try {
            const authors = await this.repo
                .createQueryBuilder()
                .where("name = :name", { name })
                .getOne();

            if (!authors) {
                return failure(new NotFoundError("Author not found."));
            }

            return success(authors);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };

    async findById(userId: string): Promise<AuthorResponse> {
        try {
            const author = await this.repo
                .createQueryBuilder()
                .where("id = :userId", { userId })
                .getOne();

            if (!author) {
                return failure(new NotFoundError("Author not found."));
            }

            return success(author);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findOne(options: FindOneOptions<Author>): Promise<AuthorResponse> {
        return Helpers.trySuccessFail(async () => {
            const res = await this.repo.findOne(options);
            return success(res);
        });
    }

    async save(obj: Author): Promise<AuthorResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<Author, "accounts">,
        dbTxn?: EntityManager
    ): Promise<AuthorResponse> {
        try {
            const newAuthor = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newAuthor);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
