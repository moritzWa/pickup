import { dataSource } from "src/core/infra/postgres";
import { User } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    hasValue,
    Maybe,
    success,
    UnexpectedError,
} from "src/core/logic";
import { pgUserRepo } from "../infra/postgres";
import { EntityManager, FindManyOptions, FindOneOptions } from "typeorm";
import { Slack, SlackChannel } from "src/utils";

const DEFAULT_NUM_TXNS = 1000;

type CreateUserResponse = FailureOrSuccess<DefaultErrors, { user: User }>;

type AutoCreateClientResponse = FailureOrSuccess<DefaultErrors, { user: User }>;

const update = (userId: string, params: Partial<User>, dbTxn?: EntityManager) =>
    pgUserRepo.update(userId, params, dbTxn);

const bulkUpdate = async (txnIds: string[], updates: Partial<User>) =>
    pgUserRepo.bulkUpdate(txnIds, updates);

const create = async (
    params: Omit<User, "accounts" | "number" | "currentContentSession">
): Promise<CreateUserResponse> => {
    let user: Maybe<User> = null;

    try {
        await dataSource.manager.transaction(async (dbTxn) => {
            const numUser = await dbTxn.count(User);

            const newUserResponse = await pgUserRepo.create(
                { ...params, number: numUser + 1 },
                dbTxn
            );

            // Note: we want to throw so the db txn fails
            if (newUserResponse.isFailure()) {
                throw newUserResponse.error;
            }

            const newUser = newUserResponse.value;

            user = newUser;
        });

        // this should never happen but just adding the check instead of doing a null assertion. a nullable user
        // should be handled above (thrown error bc we cannot create it)
        if (!user) {
            return failure(new UnexpectedError("User not created"));
        }

        return success({ user });
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const findById = (id: string) => pgUserRepo.findById(id);

const save = (user: User) => pgUserRepo.save(user);

const findByEmail = (email: string) => pgUserRepo.findByEmail(email);

const findByIds = (userIds: string[]) => pgUserRepo.findByIds(userIds);

const find = (options: FindManyOptions<User>) => pgUserRepo.find(options);

const findOne = (options: FindOneOptions<User>) => pgUserRepo.findOne(options);

const findByUsername = (username: string) =>
    pgUserRepo.findByUsername(username);

const findForReferralCode = async (
    referralCode: Maybe<string>
): Promise<FailureOrSuccess<DefaultErrors, Maybe<User>>> => {
    if (!referralCode) {
        return success(null);
    }

    const userResponse = await pgUserRepo.findByReferralCode(
        referralCode.toLowerCase().trim()
    );

    if (userResponse.isFailure()) return failure(userResponse.error);

    return userResponse;
};

const logToSlack = async (user: User, clientId: Maybe<string>) => {
    void Slack.postSlackChannel({
        channel: SlackChannel.Traders,
        text:
            "```" +
            [
                "New User Joined 🚀\n",
                `Name: ${user.name || "none"}`,
                `Email: ${user.email}`,
                `ID: ${user.id}`,
                `Link: https://movement.market/email/${user.email || ""}`,
            ]
                .filter(hasValue)
                .join("\n") +
            "```",
        preformat: true,
    });
};

export const UserService = {
    update,
    create,
    save,
    find,
    findOne,
    findById,
    findByEmail,
    findByUsername,
    findForReferralCode,
    findByIds,
    bulkUpdate,
    logToSlack,
};
