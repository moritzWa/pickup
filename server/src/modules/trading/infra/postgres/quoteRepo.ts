import {
    EntityManager,
    FindManyOptions,
    getRepository,
    InsertResult,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import {
    AccountProvider,
    Quote as QuoteModel,
} from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type QuoteResponse = FailureOrSuccess<DefaultErrors, QuoteModel>;
type QuoteArrayResponse = FailureOrSuccess<DefaultErrors, QuoteModel[]>;

export class PostgresQuoteRepository {
    constructor(private model: typeof QuoteModel) {}

    private get repo(): Repository<QuoteModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<QuoteModel>
    ): Promise<QuoteArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async count(
        options: FindManyOptions<QuoteModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(
        quoteId: string,
        opts?: FindManyOptions<QuoteModel>
    ): Promise<QuoteResponse> {
        try {
            const quote = await this.repo.findOne({
                ...opts,
                where: {
                    ...opts?.where,
                    id: quoteId,
                },
            });

            if (!quote) {
                return failure(new NotFoundError("Quote not found."));
            }

            return success(quote);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(quoteIds: string[]): Promise<QuoteArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const quotes = await this.repo
                .createQueryBuilder()
                .where("id IN (:...quoteIds)", { quoteIds })
                .getMany();

            return success(quotes);
        });
    }

    async findByEmail(email: string): Promise<QuoteResponse> {
        return await Helpers.trySuccessFail(async () => {
            const quote = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!quote) {
                return failure(new NotFoundError("Quote not found."));
            }
            return success(quote);
        });
    }

    async update(
        quoteId: string,
        updates: Partial<QuoteModel>,
        dbTxn?: EntityManager
    ): Promise<QuoteResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: quoteId }, updates)
                : await this.repo.update(quoteId, updates);

            const quote = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: quoteId })
                : await this.repo.findOneBy({ id: quoteId });

            if (!quote) {
                return failure(new NotFoundError("Quote does not exist!"));
            }

            return success(quote);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async save(obj: QuoteModel): Promise<QuoteResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<QuoteModel, "client" | "account" | "quote">,
        dbTxn?: EntityManager
    ): Promise<QuoteResponse> {
        try {
            const newQuote = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newQuote);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkCreate(
        rowData: Omit<QuoteModel, "client" | "account" | "quote">[]
    ): Promise<FailureOrSuccess<DefaultErrors, InsertResult>> {
        try {
            const response = await this.repo
                .createQueryBuilder()
                .insert()
                .into(QuoteModel)
                .values(rowData)
                .onConflict("DO NOTHING")
                .execute();

            return success(response);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
