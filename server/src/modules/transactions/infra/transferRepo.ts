import {
    EntityManager,
    FindManyOptions,
    FindOptionsWhere,
    getRepository,
    In,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import {
    AccountProvider,
    Transfer as TransferModel,
} from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";
import { chunk } from "lodash";
import { promise } from "zod";

type TransferResponse = FailureOrSuccess<DefaultErrors, TransferModel>;
type TransferArrayResponse = FailureOrSuccess<DefaultErrors, TransferModel[]>;

export class PostgresTransferRepository {
    constructor(private model: typeof TransferModel) {}

    private get repo(): Repository<TransferModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<TransferModel>
    ): Promise<TransferArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async count(
        options: FindManyOptions<TransferModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(transferId: string): Promise<TransferResponse> {
        try {
            const transfer = await this.repo
                .createQueryBuilder()
                .where("id = :transferId", { transferId })
                .getOne();

            if (!transfer) {
                return failure(new NotFoundError("Transfer not found."));
            }

            return success(transfer);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(transferIds: string[]): Promise<TransferArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const transfers = await this.repo
                .createQueryBuilder()
                .where("id IN (:...transferIds)", { transferIds })
                .getMany();

            return success(transfers);
        });
    }

    async findForUser(
        userId: string,
        opts?: FindManyOptions<TransferModel>
    ): Promise<TransferArrayResponse> {
        try {
            const transfers = await this.repo.find({
                ...opts,
                where: {
                    ...opts?.where,
                    userId: userId,
                },
            });

            return success(transfers);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // async findForHash(
    //     userId: string,
    //     hash: string,
    //     provider: AccountProvider,
    //     opts?: FindManyOptions<TransferModel>
    // ): Promise<TransferResponse> {
    //     try {
    //         const transfer = await this.repo.findOne({
    //             ...opts,
    //             where: {
    //                 ...opts?.where,
    //                 hash: hash,
    //                 provider: provider,
    //                 userId: userId,
    //             },
    //         });

    //         if (!transfer) {
    //             return failure(new NotFoundError("Transfer not found."));
    //         }

    //         return success(transfer);
    //     } catch (err) {
    //         return failure(new UnexpectedError(err));
    //     }
    // }

    async update(
        transferId: string,
        updates: Partial<TransferModel>,
        dbTxn?: EntityManager
    ): Promise<TransferResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: transferId }, updates)
                : await this.repo.update(transferId, updates);

            const transfer = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: transferId })
                : await this.repo.findOneBy({ id: transferId });

            if (!transfer) {
                return failure(new NotFoundError("Transfer does not exist!"));
            }

            return success(transfer);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async save(obj: TransferModel): Promise<TransferResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(transferId: string): Promise<TransferResponse> {
        try {
            const transfer = await this.repo.findOne({
                where: { id: transferId },
            });

            if (!transfer) {
                return failure(new NotFoundError("Transfer does not exist!"));
            }

            await this.repo.delete({ id: transferId });

            return success(transfer);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<TransferModel, "accounts">,
        dbTxn?: EntityManager
    ): Promise<TransferResponse> {
        try {
            const newTransfer = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newTransfer);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
