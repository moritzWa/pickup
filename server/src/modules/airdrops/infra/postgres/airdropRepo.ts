import {
    EntityManager,
    FindManyOptions,
    getRepository,
    LessThanOrEqual,
    MoreThanOrEqual,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import {
    Airdrop,
    Airdrop as AirdropModel,
} from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type AirdropResponse = FailureOrSuccess<DefaultErrors, AirdropModel>;
type AirdropArrayResponse = FailureOrSuccess<DefaultErrors, AirdropModel[]>;

export class PostgresAirdropRepository {
    constructor(private model: typeof AirdropModel) {}

    private get repo(): Repository<AirdropModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<AirdropModel>
    ): Promise<AirdropArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async exists(
        airdropId: string
    ): Promise<FailureOrSuccess<DefaultErrors, boolean>> {
        try {
            const exists = await this.repo.exist({
                where: { id: airdropId },
            });

            return success(exists);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findCurrent(): Promise<
        FailureOrSuccess<DefaultErrors, Maybe<Airdrop>>
    > {
        try {
            const now = new Date();
            const res = await this.repo.findOne({
                where: {
                    startDate: LessThanOrEqual(now),
                    endDate: MoreThanOrEqual(now),
                },
            });

            return success(res);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async count(
        options: FindManyOptions<AirdropModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(airdropId: string): Promise<AirdropResponse> {
        try {
            const airdrop = await this.repo
                .createQueryBuilder()
                .where("id = :airdropId", { airdropId })
                .getOne();

            if (!airdrop) {
                return failure(new NotFoundError("Airdrop not found."));
            }

            return success(airdrop);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(airdropIds: string[]): Promise<AirdropArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const airdrops = await this.repo
                .createQueryBuilder()
                .where("id IN (:...airdropIds)", { airdropIds })
                .getMany();

            return success(airdrops);
        });
    }

    async findByEmail(email: string): Promise<AirdropResponse> {
        return await Helpers.trySuccessFail(async () => {
            const airdrop = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!airdrop) {
                return failure(new NotFoundError("Airdrop not found."));
            }
            return success(airdrop);
        });
    }

    async update(
        airdropId: string,
        updates: Partial<AirdropModel>,
        dbTxn?: EntityManager
    ): Promise<AirdropResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: airdropId }, updates)
                : await this.repo.update(airdropId, updates);

            const airdrop = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: airdropId })
                : await this.repo.findOneBy({ id: airdropId });

            if (!airdrop) {
                return failure(new NotFoundError("Airdrop does not exist!"));
            }

            return success(airdrop);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async save(obj: AirdropModel): Promise<AirdropResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(airdropId: string): Promise<AirdropResponse> {
        try {
            const airdrop = await this.repo.findOne({
                where: { id: airdropId },
            });

            if (!airdrop) {
                return failure(new NotFoundError("Airdrop does not exist!"));
            }

            await this.repo.delete({ id: airdropId });

            return success(airdrop);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<AirdropModel, "accounts">,
        dbTxn?: EntityManager
    ): Promise<AirdropResponse> {
        try {
            const newAirdrop = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newAirdrop);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
