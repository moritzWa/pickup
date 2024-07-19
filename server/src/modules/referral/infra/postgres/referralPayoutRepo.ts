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
import { ReferralPayout as ReferralPayoutModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";
import moment = require("moment");
import { sql } from "pg-sql";
import BigNumber from "bignumber.js";

type ReferralPayoutFeeResponse = FailureOrSuccess<
    DefaultErrors,
    ReferralPayoutModel
>;
type ReferralPayoutFeeArrayResponse = FailureOrSuccess<
    DefaultErrors,
    ReferralPayoutModel[]
>;

export class PostgresReferralPayoutFeeRepository {
    constructor(private model: typeof ReferralPayoutModel) {}

    private get repo(): Repository<ReferralPayoutModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<ReferralPayoutModel>
    ): Promise<ReferralPayoutFeeArrayResponse> {
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
                SELECT SUM(commission_fiat_amount_cents) as total_earnings
                FROM swap_commissions
                WHERE user_id = ${userId}
            `;

            const res = await this.repo.query(query.text, query.values);

            const totalEarnings = res[0].total_earnings;

            return success(new BigNumber(totalEarnings));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async count(
        options: FindManyOptions<ReferralPayoutModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(
        referralpayoutfeeId: string,
        opts?: FindManyOptions<ReferralPayoutModel>
    ): Promise<ReferralPayoutFeeResponse> {
        try {
            const referralpayoutfee = await this.repo.findOne({
                ...opts,
                where: {
                    ...opts?.where,
                    id: referralpayoutfeeId,
                },
            });

            if (!referralpayoutfee) {
                return failure(
                    new NotFoundError("ReferralPayoutFee not found.")
                );
            }

            return success(referralpayoutfee);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByEmail(email: string): Promise<ReferralPayoutFeeResponse> {
        return await Helpers.trySuccessFail(async () => {
            const referralpayoutfee = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!referralpayoutfee) {
                return failure(
                    new NotFoundError("ReferralPayoutFee not found.")
                );
            }
            return success(referralpayoutfee);
        });
    }

    async update(
        referralpayoutfeeId: string,
        updates: Partial<ReferralPayoutModel>,
        dbTxn?: EntityManager
    ): Promise<ReferralPayoutFeeResponse> {
        try {
            dbTxn
                ? await dbTxn.update(
                      this.model,
                      { id: referralpayoutfeeId },
                      updates
                  )
                : await this.repo.update(referralpayoutfeeId, updates);

            const referralpayoutfee = dbTxn
                ? await dbTxn.findOneBy(this.model, {
                      id: referralpayoutfeeId,
                  })
                : await this.repo.findOneBy({ id: referralpayoutfeeId });

            if (!referralpayoutfee) {
                return failure(
                    new NotFoundError("ReferralPayoutFee does not exist!")
                );
            }

            return success(referralpayoutfee);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async updateMany(
        where: FindOptionsWhere<ReferralPayoutModel>,
        updates: Partial<ReferralPayoutModel>,
        dbTxn?: EntityManager
    ): Promise<FailureOrSuccess<DefaultErrors, void>> {
        return Helpers.trySuccessFail(async () => {
            return dbTxn
                ? await dbTxn.update(this.model, where, updates)
                : await this.repo.update(where, updates);
        });
    }

    async save(obj: ReferralPayoutModel): Promise<ReferralPayoutFeeResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<
            ReferralPayoutModel,
            | "client"
            | "account"
            | "quote"
            | "user"
            | "swap"
            | "traderUser"
            | "commissionRecipientUser"
        >,
        dbTxn?: EntityManager
    ): Promise<ReferralPayoutFeeResponse> {
        try {
            const newReferralPayoutFee = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newReferralPayoutFee);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
