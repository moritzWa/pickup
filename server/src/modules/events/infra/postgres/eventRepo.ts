import {
    DeleteResult,
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    FindOptionsWhere,
    getRepository,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { Event } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

export type EventParams = Omit<
    Event,
    "id" | "createdAt" | "updatedAt" | "token"
>;
export type EventResponse = FailureOrSuccess<DefaultErrors, Event>;
export type EventArrayResponse = FailureOrSuccess<DefaultErrors, Event[]>;

export class PostgresEventRepository {
    constructor(private model: typeof Event) {}

    private get repo(): Repository<Event> {
        return dataSource.getRepository(this.model);
    }

    async find(options: FindManyOptions<Event>): Promise<EventArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findById(
        id: string,
        opts?: FindOneOptions<Event>
    ): Promise<EventResponse> {
        try {
            const obj = await this.repo.findOne({
                ...opts,
                where: { ...opts?.where, id },
            });

            if (!obj) {
                return failure(new NotFoundError("Event not found."));
            }

            return success(obj);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async count(
        opts?: FindManyOptions<Event>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        try {
            const count = await this.repo.count(opts);

            return success(count);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async update(
        objId: string,
        updates: Partial<Event>,
        dbTxn?: EntityManager
    ): Promise<EventResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: objId }, updates)
                : await this.repo.update(objId, updates);

            const obj = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: objId })
                : await this.repo.findOneBy({ id: objId });

            if (!obj) {
                return failure(new NotFoundError("Event does not exist!"));
            }

            return success(obj);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: EventParams,
        dbTxn?: EntityManager
    ): Promise<EventResponse> {
        try {
            const obj = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(obj);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async delete(
        where: FindOptionsWhere<Event>
    ): Promise<FailureOrSuccess<DefaultErrors, DeleteResult>> {
        try {
            const deleteResponse = await this.repo.delete(where);

            return success(deleteResponse);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
