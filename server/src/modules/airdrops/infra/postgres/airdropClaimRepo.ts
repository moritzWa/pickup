import {
    EntityManager,
    FindManyOptions,
    getRepository,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import {
    AirdropClaim,
    AirdropClaim as AirdropClaimModel,
} from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type AirdropClaimResponse = FailureOrSuccess<DefaultErrors, AirdropClaimModel>;
type AirdropClaimArrayResponse = FailureOrSuccess<
    DefaultErrors,
    AirdropClaimModel[]
>;

export class PostgresAirdropClaimRepository {
    constructor(private model: typeof AirdropClaimModel) {}

    private get repo(): Repository<AirdropClaimModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<AirdropClaimModel>
    ): Promise<AirdropClaimArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findForUser(userId: string): Promise<AirdropClaimArrayResponse> {
        try {
            if (!userId) {
                return failure(new NotFoundError("User not found."));
            }

            const claims = await this.repo.find({
                where: [
                    {
                        invitedUserId: userId,
                    },
                    {
                        inviterUserId: userId,
                    },
                ],
            });

            return success(claims);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findForInviterUserAndAirdrop(
        userId: string,
        airdropId: string,
        opts?: FindManyOptions<AirdropClaimModel>
    ): Promise<AirdropClaimResponse> {
        try {
            const claim = await this.repo.findOne({
                ...opts,
                where: {
                    ...opts?.where,
                    inviterUserId: userId,
                    airdropId,
                },
            });

            if (!claim) {
                return failure(new NotFoundError("Airdrop claim not found."));
            }

            return success(claim);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findClaimForInviterUserMaybeNull(
        userId: string,
        airdropId: string,
        opts?: FindManyOptions<AirdropClaimModel>
    ): Promise<FailureOrSuccess<DefaultErrors, Maybe<AirdropClaim>>> {
        try {
            const claim = await this.repo.findOne({
                ...opts,
                where: {
                    ...opts?.where,
                    inviterUserId: userId,
                    airdropId,
                },
            });

            return success(claim);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findClaimForInvitedUserMaybeNull(
        userId: string,
        airdropId: string,
        opts?: FindManyOptions<AirdropClaimModel>
    ): Promise<FailureOrSuccess<DefaultErrors, Maybe<AirdropClaim>>> {
        try {
            const claim = await this.repo.findOne({
                ...opts,
                where: {
                    ...opts?.where,
                    invitedUserId: userId,
                    airdropId,
                },
            });

            return success(claim);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByCode(code: string): Promise<AirdropClaimResponse> {
        try {
            const claim = await this.repo.findOne({
                where: {
                    code,
                },
            });

            if (!claim) {
                return failure(new NotFoundError("AirdropClaim not found."));
            }

            return success(claim);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findIfUserIsInviterForAirdrop(
        userId: string,
        airdropId: string
    ): Promise<FailureOrSuccess<DefaultErrors, Maybe<AirdropClaim>>> {
        try {
            if (!userId) {
                return failure(new NotFoundError("User not found."));
            }

            const claim = await this.repo.findOne({
                where: {
                    inviterUserId: userId,
                    airdropId,
                },
            });

            return success(claim);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async count(
        options: FindManyOptions<AirdropClaimModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(
        airdropclaimId: string,
        opts?: FindManyOptions<AirdropClaim>
    ): Promise<AirdropClaimResponse> {
        try {
            const airdropclaim = await this.repo.findOne({
                ...opts,
                where: { ...opts?.where, id: airdropclaimId },
            });

            if (!airdropclaim) {
                return failure(new NotFoundError("AirdropClaim not found."));
            }

            return success(airdropclaim);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(
        airdropclaimIds: string[]
    ): Promise<AirdropClaimArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const airdropclaims = await this.repo
                .createQueryBuilder()
                .where("id IN (:...airdropclaimIds)", { airdropclaimIds })
                .getMany();

            return success(airdropclaims);
        });
    }

    async findByEmail(email: string): Promise<AirdropClaimResponse> {
        return await Helpers.trySuccessFail(async () => {
            const airdropclaim = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!airdropclaim) {
                return failure(new NotFoundError("AirdropClaim not found."));
            }
            return success(airdropclaim);
        });
    }

    async update(
        airdropclaimId: string,
        updates: Partial<AirdropClaimModel>,
        dbTxn?: EntityManager
    ): Promise<AirdropClaimResponse> {
        try {
            dbTxn
                ? await dbTxn.update(
                      this.model,
                      { id: airdropclaimId },
                      updates
                  )
                : await this.repo.update(airdropclaimId, updates);

            const airdropclaim = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: airdropclaimId })
                : await this.repo.findOneBy({ id: airdropclaimId });

            if (!airdropclaim) {
                return failure(
                    new NotFoundError("AirdropClaim does not exist!")
                );
            }

            return success(airdropclaim);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async save(obj: AirdropClaimModel): Promise<AirdropClaimResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(airdropclaimId: string): Promise<AirdropClaimResponse> {
        try {
            const airdropclaim = await this.repo.findOne({
                where: { id: airdropclaimId },
            });

            if (!airdropclaim) {
                return failure(
                    new NotFoundError("AirdropClaim does not exist!")
                );
            }

            await this.repo.delete({ id: airdropclaimId });

            return success(airdropclaim);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<AirdropClaimModel, "invited" | "inviter" | "airdrop">,
        dbTxn?: EntityManager
    ): Promise<AirdropClaimResponse> {
        try {
            const newAirdropClaim = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newAirdropClaim);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
