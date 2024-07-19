import { DateTime } from "luxon";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    Maybe,
    success,
    UnexpectedError,
} from "src/core/logic";
import { coingecko } from "src/utils/coingecko/coingecko";
import * as IORedis from "ioredis";
import { CoinGeckoTokenId } from "src/utils/coingecko/types";
import { Helpers } from "src/utils";
import { last, tryit } from "radash";
import { writeFileSync } from "fs";
import { cloneDeep, isNil } from "lodash/fp";
import { CurrencyCode } from "src/shared/domain";
import BigNumber from "bignumber.js";

export type PriceInterval = { date: Date; price: number };
export type PricingIntervalLookup = Record<string, PriceInterval>;

export type PriceResponse = FailureOrSuccess<
    DefaultErrors,
    { hasPricingForDate: boolean; price: Maybe<number> }
>;

export const PRICING_CACHE_PREFIX = "pricing_cache";

/**
 * Pricing Cache Class
 *
 * this will cache historical data in memory for a token
 * 7 years of ETH data takes about 150kb of memory to cache, so it doesn't take much to cache this data
 */
export class PricingCache {
    public lookup: Maybe<PricingIntervalLookup> = null;
    private warmed: boolean = false;

    constructor(
        private assetName: string,
        private numberOfDays: number = 1000,
        private cache: IORedis.Redis
    ) {}

    private buildLookupMapping = async (): Promise<
        FailureOrSuccess<DefaultErrors, PricingIntervalLookup>
    > => {
        try {
            const historicalDataResponse = await coingecko.getHistoricalData(
                this.assetName,
                this.numberOfDays
            );

            if (historicalDataResponse.isFailure()) {
                return failure(historicalDataResponse.error);
            }

            const historicalData = historicalDataResponse.value;
            const mostRecentPrice = historicalData[historicalData.length - 1];

            // Note: this is wayyy faster than doing the reduce
            const _lookup = Object.create({});
            for (let i = 0; i < historicalData.length; i++) {
                const price = historicalData[i];
                const formattedDate = price.end.toISOString();
                _lookup[formattedDate] = {
                    date: formattedDate,
                    price: price.price,
                };
            }

            const lookupResponse = _buildLookupWithoutMissingGaps(_lookup);

            if (lookupResponse.isFailure()) {
                return failure(lookupResponse.error);
            }

            const lookup = lookupResponse.value;
            // build a new lookup mapping where you fill in any missing dates

            // take the most recent price and go to end of day so can have the current day's "ending" price
            // note: this will change throughout the day
            if (mostRecentPrice) {
                const lastDate = DateTime.fromJSDate(mostRecentPrice.end)
                    .toUTC()
                    .endOf("day")
                    .plus({ milliseconds: 1 })
                    .toISO();

                lookup[lastDate] = {
                    date: new Date(lastDate),
                    price: mostRecentPrice.price,
                };
            }

            return success(lookup);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };

    private hardRefreshPricingData = async (): Promise<
        FailureOrSuccess<DefaultErrors, PricingIntervalLookup>
    > => {
        const newLookupResponse = await this.buildLookupMapping();

        if (newLookupResponse.isFailure()) {
            return newLookupResponse;
        }

        this.lookup = newLookupResponse.value;
        void this.cache.set(
            `${PRICING_CACHE_PREFIX}:${this.assetName}`,
            JSON.stringify(newLookupResponse.value)
        );

        return success(this.lookup);
    };

    public isWarmed() {
        return this.warmed;
    }

    // this warms the in memory-cache with most recent data
    public warm = async (): Promise<FailureOrSuccess<DefaultErrors, null>> => {
        try {
            const cache = this.cache;
            const key = `${PRICING_CACHE_PREFIX}:${this.assetName}`;

            // the point of warmed is to quickly be able to get the history of an asset (if it exists)
            // without having to build the big lookup table. this speeds up the first refresh a lot,
            // but we only want to use it for the first time it is warmed and then be able to build the hashmap periodically after that
            if (!this.warmed) {
                const [err, hit] = await tryit((k) => cache.get(k))(key);

                const rawLookupResponse = Helpers.maybeParseJSON<any>(hit);

                // if there is a cache hit, set the lookup to the redis data
                if (
                    rawLookupResponse.isSuccess() &&
                    !!rawLookupResponse.value
                ) {
                    // console.log(`redis cache hit: ${this.assetName}`);
                    const rawLookup: PricingIntervalLookup =
                        rawLookupResponse.value;

                    const isUpToDate = _getIsUpToDateCache(
                        this.assetName,
                        rawLookup
                    );

                    // only set the cache if the greatest key is today (not missing any information)
                    // note: if the greatest key is tomorrow, we can still use the cache (it'll get reset)
                    if (!isUpToDate) {
                        // console.log(
                        //     `[cache is stale for ${this.assetName}. refreshing...]`
                        // );
                        await this.hardRefreshPricingData();
                        this.warmed = true;
                        return success(null);
                    }

                    // console.log(`[cache hit and up to date for ${this.assetName}]`);

                    this.lookup = rawLookup;
                    this.warmed = true;
                    return success(null);
                }

                // console.log(`redis cache miss: ${this.assetName}`);
                await this.hardRefreshPricingData();
                this.warmed = true;
                return success(null);
            }

            return success(null); // already warmed
        } catch (err) {
            console.error(err);
            return failure(new UnexpectedError(err));
        }
    };

    public refresh = async (hardRefresh: boolean) => {
        // makes a request to coingecko
        if (hardRefresh) {
            // wipe the lookup and refresh with coingecko
            await this.hardRefreshPricingData();
            return;
        }

        await this.warm();
    };

    public getTree = (): Maybe<PricingIntervalLookup> => this.lookup;

    public getNumberOfTreeKeys = (): Maybe<number> =>
        Object.keys(this.lookup || {}).length;

    public getByteSize = () => {
        // get the byte size of the this.lookup mapping.
        // Serialize the this.lookup mapping to a JSON string
        try {
            const jsonString = JSON.stringify(this.lookup);

            // Convert the JSON string to a Blob and measure its size
            const blob = new Blob([jsonString], { type: "application/json" });

            // Return the size of the blob
            return blob.size;
        } catch (err) {
            return null;
        }
    };

    // this returns a value in dollars (ex. 9.19 = $9.19)
    public getPrice = async (date: Date): Promise<PriceResponse> => {
        try {
            if (!this.lookup) {
                return failure(
                    new UnexpectedError(
                        "No pricing lookup found for asset: ",
                        this.assetName
                    )
                );
            }

            const lookup = this.lookup;

            const dateToLookup = DateTime.fromJSDate(new Date(date))
                .toUTC()
                .endOf("day")
                .plus({ milliseconds: 1 });

            const priceInterval = lookup[dateToLookup.toISO()] ?? null;

            if (isNil(priceInterval) || isNil(priceInterval?.price)) {
                return success({
                    hasPricingForDate: false,
                    price: null,
                });
            }

            // if null -> coingecko probably doesn't have price data for the provided date
            return success({
                hasPricingForDate: true,
                price: priceInterval.price,
            });
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };
}

const _getIsUpToDateCache = (assetName: string, rawLookup: any) => {
    const dates = Object.keys(rawLookup);
    // least to greatest
    const sortedDates = dates.sort();
    const greatestKey = last(sortedDates);

    const today = DateTime.local()
        .toUTC()
        .endOf("day")
        .plus({ milliseconds: 1 })
        .toISO();

    return today <= greatestKey;
};

const _buildLookupWithoutMissingGaps = (
    lookup: Record<string, { date: Date; price: number }>
): FailureOrSuccess<
    DefaultErrors,
    Record<string, { date: Date; price: number }>
> => {
    try {
        const oldValues = Object.values(lookup);
        const newValues: { date: Date; price: number }[] = [];

        for (let i = 0; i < oldValues.length - 1; i++) {
            const currentValue = oldValues[i];
            const nextValue = oldValues[i + 1];

            const currentDate = new Date(currentValue.date);

            // add the current value
            newValues.push({
                date: currentDate,
                price: currentValue.price,
            });

            if (!nextValue) {
                continue;
            }

            const nextDate = new Date(nextValue.date);
            const timeDiff = nextDate.getTime() - currentDate.getTime();
            const daysBetween = timeDiff / (1000 * 3600 * 24); // Calculate days between dates

            if (daysBetween > 1) {
                for (let j = 1; j < daysBetween; j++) {
                    const dateToAdd = new Date(currentDate);
                    dateToAdd.setDate(currentDate.getDate() + j);
                    newValues.push({
                        date: dateToAdd,
                        price: currentValue.price,
                    });
                }
            }
        }

        const lastElement = last(oldValues);

        newValues.push({
            date: lastElement.date,
            price: lastElement.price,
        });

        // Convert the values array back to a lookup object
        const lookupWithGaps = newValues.reduce((acc, curr) => {
            const dateKey = new Date(curr.date).toISOString();
            acc[dateKey] = { date: new Date(curr.date), price: curr.price };
            return acc;
        }, {});

        return success(lookupWithGaps);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};
