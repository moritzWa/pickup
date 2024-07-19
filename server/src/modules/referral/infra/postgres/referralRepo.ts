import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    getRepository,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { Referral } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type ReferralResponse = FailureOrSuccess<DefaultErrors, Referral>;
type ReferralArrayResponse = FailureOrSuccess<DefaultErrors, Referral[]>;

export class PostgresReferralRepository {
    constructor(private model: typeof Referral) {}

    private get repo(): Repository<Referral> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<Referral>
    ): Promise<ReferralArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findOne(
        options: FindOneOptions<Referral>
    ): Promise<FailureOrSuccess<DefaultErrors, Maybe<Referral>>> {
        try {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.findOne(query);
            return success(res);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async hasBeenReferred(
        userId: string
    ): Promise<FailureOrSuccess<DefaultErrors, boolean>> {
        try {
            const exists = await this.repo.exist({
                where: { referredUserId: userId },
            });
            return success(exists);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findReferralsWhereUserReferred(
        userId: string,
        options?: FindManyOptions<Referral>
    ): Promise<ReferralArrayResponse> {
        try {
            const referrals = await this.repo.find({
                ...options,
                where: { ...options?.where, referredByUserId: userId },
                relations: { ...options?.relations, referredUser: true },
            });

            return success(referrals);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findReferralsWhereUserReferredCount(
        userId: string,
        options?: FindManyOptions<Referral>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        try {
            const referrals = await this.repo.count({
                ...options,
                where: { ...options?.where, referredByUserId: userId },
                relations: { ...options?.relations, referredUser: true },
            });

            return success(referrals);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findReferralsClientWasReferred(
        myUserId: string,
        options?: FindManyOptions<Referral>
    ): Promise<ReferralArrayResponse> {
        try {
            const referrals = await this.repo.find({
                ...options,
                where: { ...options?.where, referredUserId: myUserId },
                relations: { ...options?.relations, referredUser: true },
            });

            return success(referrals);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findById(
        refId: string,
        opts?: FindOneOptions<Referral>
    ): Promise<ReferralResponse> {
        try {
            const referral = await this.repo.findOne({
                ...opts,
                where: { ...opts?.where, id: refId },
            });

            if (!referral) {
                return failure(new NotFoundError("Referral not found."));
            }

            return success(referral);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async update(
        referralId: string,
        updates: Partial<Referral>,
        dbTxn?: EntityManager
    ): Promise<ReferralResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: referralId }, updates)
                : await this.repo.update(referralId, updates);

            const referral = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: referralId })
                : await this.repo.findOneBy({ id: referralId });

            if (!referral) {
                return failure(new NotFoundError("Referral does not exist!"));
            }

            return success(referral);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<
            Referral,
            | "referredByUser"
            | "referredUser"
            | "referredByClient"
            | "referredClient"
        >,
        dbTxn?: EntityManager
    ): Promise<ReferralResponse> {
        try {
            const newUser = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newUser);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
