import moment = require("moment");
import { DateInfoForPricingProvider } from "./types";
import { Maybe } from "src/core/logic";
import { Granularity } from "src/shared/domain";

export const roundToNearestIncrementV2 = (
    date: Date,
    dateInfo: DateInfoForPricingProvider,
    createdAt: Maybe<Date>
): Date => {
    if (createdAt) {
        const poolCreated = moment(createdAt).toDate();

        // if the pool is less than 30 days and we aren't looking at day or week,
        // go to an hour total
        if (
            moment().diff(poolCreated, "days") < 30 &&
            dateInfo.granularity !== Granularity.Hour &&
            dateInfo.granularity !== Granularity.Day &&
            dateInfo.granularity !== Granularity.Week
        ) {
            return moment(date).startOf("hour").toDate();
        }

        // if it is all and the coin is less than a year old, do daily increments
        if (
            dateInfo.granularity === Granularity.All &&
            moment().diff(poolCreated, "years") < 1
        ) {
            return moment(date).startOf("day").toDate();
        }
    }

    // Calculate the difference from the nearest increment
    const remainder =
        moment(date).get(dateInfo.dateTimeUnit) % dateInfo.increment;
    const halfIncrement = dateInfo.increment / 2;
    let adjustment;

    if (remainder < halfIncrement) {
        // Subtract the remainder if it's less than half the increment
        adjustment = -remainder;
    } else {
        // Otherwise, add the difference to reach the next increment
        adjustment = dateInfo.increment - remainder;
    }

    // Adjust the date and round it to the start of the increment
    return moment(date)
        .add({ [dateInfo.dateTimeUnit]: adjustment })
        .startOf(dateInfo.dateTimeUnit)
        .toDate();
};
