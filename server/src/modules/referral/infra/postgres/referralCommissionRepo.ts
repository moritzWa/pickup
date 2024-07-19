import {
    EntityManager,
    FindManyOptions,
    FindOptionsWhere,
    getRepository,
    In,
    MoreThan,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { ReferralCommission as ReferralCommissionModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";
import moment = require("moment");
import { sql } from "pg-sql";
import BigNumber from "bignumber.js";

type ReferralCommissionFeeResponse = FailureOrSuccess<
    DefaultErrors,
    ReferralCommissionModel
>;
type ReferralCommissionFeeArrayResponse = FailureOrSuccess<
    DefaultErrors,
    ReferralCommissionModel[]
>;

export class PostgresReferralCommissionFeeRepository {
    constructor(private model: typeof ReferralCommissionModel) {}

    private get repo(): Repository<ReferralCommissionModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<ReferralCommissionModel>
    ): Promise<ReferralCommissionFeeArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async totalEarnings(
        userId: string
    ): Promise<FailureOrSuccess<DefaultErrors, BigNumber>> {
        try {
            // all commission summing the commission field for the user
            const query = sql`
                SELECT SUM(r.commission_fiat_amount_cents) as total_earnings
                FROM referral_commissions r
                WHERE r.commission_recipient_user_id = ${userId}
            `;

            const res = await this.repo.query(query.text, query.values);

            const totalEarnings = res[0].total_earnings ?? 0;

            console.log("EARNINGS: " + totalEarnings);

            return success(new BigNumber(totalEarnings));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async count(
        options: FindManyOptions<ReferralCommissionModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(
        referralcommissionfeeId: string,
        opts?: FindManyOptions<ReferralCommissionModel>
    ): Promise<ReferralCommissionFeeResponse> {
        try {
            const referralcommissionfee = await this.repo.findOne({
                ...opts,
                where: {
                    ...opts?.where,
                    id: referralcommissionfeeId,
                },
            });

            if (!referralcommissionfee) {
                return failure(
                    new NotFoundError("ReferralCommissionFee not found.")
                );
            }

            return success(referralcommissionfee);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByEmail(email: string): Promise<ReferralCommissionFeeResponse> {
        return await Helpers.trySuccessFail(async () => {
            const referralcommissionfee = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!referralcommissionfee) {
                return failure(
                    new NotFoundError("ReferralCommissionFee not found.")
                );
            }
            return success(referralcommissionfee);
        });
    }

    async deleteForSwap(
        swapId: string
    ): Promise<FailureOrSuccess<DefaultErrors, null>> {
        return await Helpers.trySuccessFail(async () => {
            await this.repo.delete({ swapId });

            return success(null);
        });
    }

    async update(
        referralcommissionfeeId: string,
        updates: Partial<ReferralCommissionModel>,
        dbTxn?: EntityManager
    ): Promise<ReferralCommissionFeeResponse> {
        try {
            dbTxn
                ? await dbTxn.update(
                      this.model,
                      { id: referralcommissionfeeId },
                      updates
                  )
                : await this.repo.update(referralcommissionfeeId, updates);

            const referralcommissionfee = dbTxn
                ? await dbTxn.findOneBy(this.model, {
                      id: referralcommissionfeeId,
                  })
                : await this.repo.findOneBy({ id: referralcommissionfeeId });

            if (!referralcommissionfee) {
                return failure(
                    new NotFoundError("ReferralCommissionFee does not exist!")
                );
            }

            return success(referralcommissionfee);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async updateMany(
        where: FindOptionsWhere<ReferralCommissionModel>,
        updates: Partial<ReferralCommissionModel>,
        dbTxn?: EntityManager
    ): Promise<FailureOrSuccess<DefaultErrors, void>> {
        return Helpers.trySuccessFail(async () => {
            return dbTxn
                ? await dbTxn.update(this.model, where, updates)
                : await this.repo.update(where, updates);
        });
    }

    async save(
        obj: ReferralCommissionModel
    ): Promise<ReferralCommissionFeeResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<
            ReferralCommissionModel,
            | "client"
            | "account"
            | "quote"
            | "user"
            | "swap"
            | "traderUser"
            | "commissionRecipientUser"
        >,
        dbTxn?: EntityManager
    ): Promise<ReferralCommissionFeeResponse> {
        try {
            const newReferralCommissionFee = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newReferralCommissionFee);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
