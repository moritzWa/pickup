import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    NotFoundError,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { connection } from "./constants";
import { config } from "src/config";
import IORedis from "ioredis";
import { EpochSchedule } from "@solana/web3.js";
import { DateTime } from "luxon";
import { Slack, SlackChannel } from "../slack";

const PREFIX = "solana_epochs";

const redisUrl = config.redis.persistedRedisUrl;

const redis = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

const getBlockTimeForEpoch = async (
    epochFirstSlot: number
): Promise<FailureOrSuccess<DefaultErrors, Date>> => {
    try {
        const blockTime = await connection.getBlockTime(epochFirstSlot);

        if (blockTime === null) {
            return failure(new NotFoundError("Block time not found"));
        }

        return success(new Date((blockTime ?? 0) * 1000));
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const _getBlockTimeEpochRecursive = async (
    epoch: number,
    epochSchedule: EpochSchedule
): Promise<Maybe<Date>> => {
    const epochEndSlot = epoch * epochSchedule.slotsPerEpoch;
    let firstBlockTime: Maybe<Date> = null;
    let slotOffset = 0;

    while (
        firstBlockTime === null &&
        // only look up to 10 and then call it
        slotOffset < 10
    ) {
        const epochWithOffset = epochEndSlot + slotOffset;
        const response = await getBlockTimeForEpoch(epochWithOffset);

        if (response.isFailure()) {
            // debugger;
            const isMissingSlot = response.error.message.includes(
                "was skipped, or missing in long-term storage"
            );

            const notFoundSlot = response.error.message.includes(
                "Block time not found"
            );

            if (isMissingSlot || notFoundSlot) {
                slotOffset++;
            } else {
                break;
            }

            continue;
        }

        return response.value;
    }

    // first day solana went live
    const date = new Date("2020-03-13T00:00:00.000Z");
    // avg 2 days per epoch, just get elapsed day and add to get the approximate date
    const estimatedElapsedDays = 2 * epoch;
    const approximateDay = DateTime.fromJSDate(date).plus({
        days: estimatedElapsedDays,
    });

    return approximateDay.toJSDate();
};

export class EpochsLookup {
    constructor() {}

    private getEpochKey = (epoch: number): string => `${PREFIX}:${epoch}`;

    getEpochTimestamps = async (): Promise<
        FailureOrSuccess<DefaultErrors, Record<string, Date>>
    > => {
        try {
            const epochInfo = await connection.getEpochInfo();
            const latestEpoch = epochInfo.epoch;
            const epochSchedule = await connection.getEpochSchedule();

            const epochTimestamps: Record<string, Date> = {};

            for (let epoch = 0; epoch <= latestEpoch; epoch++) {
                console.log(`[getting timestamp for epoch ${epoch}]`);

                const firstBlockTime: Maybe<Date> =
                    await _getBlockTimeEpochRecursive(epoch, epochSchedule);

                if (firstBlockTime !== null) {
                    const key = this.getEpochKey(Number(epoch));
                    await redis.set(key, firstBlockTime.toISOString());

                    epochTimestamps[epoch] = firstBlockTime;
                } else {
                    console.log(
                        `[🚨 couldn't get timestamp for epoch ${epoch} 🚨]`
                    );
                }
            }

            return success(epochTimestamps);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };

    // this function will attempt to pull epoch timestamp from cache. and if it cannot, it'll just get the closest
    // epoch we can. this function can fail if there are just no close epochs
    getTimestampForEpoch = async (
        epoch: number
    ): Promise<
        FailureOrSuccess<DefaultErrors, { date: Date; closestEpoch: number }>
    > => {
        try {
            const key = this.getEpochKey(epoch);

            // get the key from redis and case to a date from a string
            const timestamp = await redis.get(key);

            if (timestamp) {
                return success({
                    date: new Date(timestamp),
                    closestEpoch: epoch,
                });
            }

            const epochSchedule = await connection.getEpochSchedule();
            const firstBlockTime = await _getBlockTimeEpochRecursive(
                epoch,
                epochSchedule
            );

            if (firstBlockTime) {
                await redis.set(key, firstBlockTime.toISOString());

                return success({
                    date: firstBlockTime,
                    closestEpoch: epoch,
                });
            }

            // if no first block -> recursively look for a close one in the PAST
            // better to recognize rewards earlier rather than later
            if (!firstBlockTime) {
                let maxLookups = 0;
                let tempEpoch = epoch - 1;
                while (maxLookups < 10) {
                    const nextEpoch = await this.getTimestampForEpoch(
                        tempEpoch
                    );

                    if (nextEpoch.isSuccess()) {
                        return nextEpoch;
                    } else {
                        tempEpoch--;
                        maxLookups++;
                    }
                }
            }

            // first day solana went live
            const date = new Date("2020-03-13T00:00:00.000Z");
            // avg 2 days per epoch, just get elapsed day and add to get the approximate date
            const estimatedElapsedDays = 2 * epoch;
            const approximateDay = DateTime.fromJSDate(date).plus({
                days: estimatedElapsedDays,
            });

            return success({
                date: approximateDay.toJSDate(),
                closestEpoch: epoch,
            });
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };
}
