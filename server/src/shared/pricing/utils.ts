import { uniqBy } from "lodash";
import { DateTime, DateTimeUnit, Duration } from "luxon";
import { Maybe, hasValue } from "src/core/logic";
import * as moment from "moment-timezone";
import { Granularity } from "../domain";

export type DateInfoForGranularity = {
    granularity: Granularity;
    dateTimeUnit: DateTimeUnit;
    increment: number;
    incrementMs: number;
    _afterUtc: Date; // in UTC
    _beforeUtc: Date; // in UTC
    afterTz: Date; // in the timezone. ex. Jan 1st 8am (utc date but adjusted for timezone)
    beforeTz: Date; // in the timezone ex. Jan 1st 8am (utc date but adjusted for timezone)
    numberOfBuckets: Maybe<number>;
    timezone: string;
    offsetMinutes: number;
};

type BuildTimestampsBetweenRangeParams = {
    start: Date;
    end: Date;
    timezone: string;
    dateTimeUnit: DateTimeUnit;
    increment: number; // in the granularity view. ex. is granularity is "day", this increment of 1 would be 1 day
};

// build a list of timestamps between start and end with the given granularity
// ex granularity = "day" and increment = 1, we go from start to end in 1 day increments
export const buildTimestampsBetweenRange = ({
    start,
    end,
    dateTimeUnit,
    increment,
}: BuildTimestampsBetweenRangeParams): Date[] => {
    // for week, this is indexed on Monday for some reason. not sure why, it just is. ex. 02/08/2021 would be a date (Monday)
    let current = DateTime.fromJSDate(start);
    const target = DateTime.fromJSDate(end);
    const timestamps: Date[] = [];

    while (current <= target) {
        timestamps.push(current.toJSDate());

        // Dynamically set the duration using granularity and increment
        const durationOpts = { [dateTimeUnit]: increment };

        current = current.plus(Duration.fromObject(durationOpts));
    }

    return timestamps; // this will be sorted
};

export const binarySearchClosestDate = (
    dates: Date[],
    targetDate: Date
): { date: Date; index: number } => {
    let left = 0;
    let right = dates.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const midDate = dates[mid];

        if (midDate.getTime() === targetDate.getTime()) {
            return { date: midDate, index: mid };
        }

        if (midDate < targetDate) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    let index: number, closestDate: Date;
    // At this point, the search has narrowed down to two adjacent dates
    if (left >= dates.length) {
        index = right;
        closestDate = dates[right];
    } else if (right < 0) {
        index = left;
        closestDate = dates[left];
    } else {
        const leftDate = dates[left];
        const rightDate = dates[right];

        // Find the closest date among the two adjacent dates
        if (
            Math.abs(leftDate.getTime() - targetDate.getTime()) <=
            Math.abs(rightDate.getTime() - targetDate.getTime())
        ) {
            index = left;
            closestDate = leftDate;
        } else {
            index = right;
            closestDate = rightDate;
        }
    }

    if (!closestDate) {
        debugger;
    }

    return { date: new Date(closestDate), index: index };
};

export function getClosestTimestamp(
    timestamp: Date,
    dateInfo: DateInfoForGranularity
): Date {
    let momentDate = moment(timestamp).clone();
    const increment = dateInfo.increment;

    switch (dateInfo.dateTimeUnit) {
        case "minute":
            const roundedMinute =
                Math.ceil(momentDate.minutes() / increment) * increment;
            momentDate.minutes(roundedMinute);
            momentDate.seconds(0);
            momentDate.milliseconds(0);
            break;
        case "hour":
            const roundedHour =
                Math.ceil(momentDate.hour() / increment) * increment;
            momentDate.hour(roundedHour);
            momentDate.minutes(0);
            momentDate.seconds(0);
            momentDate.milliseconds(0);

            break;
        case "day":
            const roundedDay =
                Math.ceil(momentDate.date() / increment) * increment;
            momentDate.date(roundedDay);
            momentDate.hour(0);
            momentDate.minutes(0);
            momentDate.seconds(0);
            momentDate.milliseconds(0);
            break;
        case "week":
            const roundedWeek =
                Math.ceil(momentDate.isoWeek() / increment) * increment;
            momentDate.week(roundedWeek - 1);
            momentDate.day(1); // Start of the week on Monday bc the all timestamps is indexed on Monday as start of week
            momentDate.hours(0);
            momentDate.minutes(0);
            momentDate.seconds(0);
            momentDate.milliseconds(0);
            break;
        case "month":
            const roundedMonth =
                Math.ceil(momentDate.month() / increment) * increment;
            momentDate.month(roundedMonth);
            momentDate.date(1);
            momentDate.hour(0);
            momentDate.minutes(0);
            momentDate.seconds(0);
            momentDate.milliseconds(0);
            break;
    }

    // add the offset at the very end
    momentDate.add(dateInfo.offsetMinutes, "minutes");

    return momentDate.toDate();
}

export const getUtcTimeSeconds = (timestamp: Date, timezone: string) =>
    Math.floor(
        moment.tz(new Date(timestamp), timezone).toDate().getTime() / 1000
    );

// FIXME: this code is a mess
export const getDateInfoForGranularityV2 = (
    i: Granularity,
    timezone: string,
    createdAt: Date
): Maybe<DateInfoForGranularity> => {
    // minutes from UTC. ex. PST is -420, so 420 minutes from UTC (have to add 420 to get the UTC)
    // we go from timezone -> UTC. ex. 1am PST + 420 minutes = 9am UTC, which is what we want
    // bc of that we do abs value. we wouldn't if we were doing UTC -> timezone, but timezone -> UTC is abs(...)
    const offset = Math.abs(moment.tz(timezone).utcOffset());

    if (createdAt) {
        const poolCreated = moment(createdAt).toDate();

        // if the pool is less than 30 days, we want to render points differently
        if (moment().diff(poolCreated, "days") < 30) {
            if (i === Granularity.Hour) {
                return _buildHour(offset, timezone);
            }

            if (i === Granularity.Day) {
                return _buildDay(offset, timezone);
            }

            if (i === Granularity.Week) {
                return _buildWeek(offset, timezone);
            }

            if (
                i === Granularity.Month ||
                i === Granularity.ThreeMonth ||
                i === Granularity.Year ||
                i === Granularity.YearToDate ||
                i === Granularity.All
            ) {
                return _buildHourlyChunksForAnyGranularity(
                    poolCreated,
                    i,
                    offset,
                    timezone
                );
            }

            return null;
        }

        // if it is all and the coin is less than a year old, do daily increments
        if (moment().diff(poolCreated, "years") < 1) {
            if (i === Granularity.Hour) {
                return _buildHour(offset, timezone);
            }

            if (i === Granularity.Day) {
                return _buildDay(offset, timezone);
            }

            if (i === Granularity.Week) {
                return _buildWeek(offset, timezone);
            }

            if (i === Granularity.Month) {
                return _buildMonthly(offset, timezone);
            }

            if (i === Granularity.ThreeMonth) {
                return _buildThreeMonth(offset, timezone);
            }

            if (i === Granularity.Year) {
                return _buildYearly(offset, timezone);
            }

            if (i === Granularity.YearToDate) {
                return _buildYTD(offset, timezone);
            }

            if (i === Granularity.All) {
                return _buildAllWithDaily(offset, timezone, createdAt);
            }

            return null;
        }
    }

    if (i === Granularity.All) {
        return _buildAllWithDaily(offset, timezone, createdAt);
    }

    if (i === Granularity.Year) {
        return _buildYearly(offset, timezone);
    }

    if (i === Granularity.YearToDate) {
        return _buildYTD(offset, timezone);
    }

    if (i === Granularity.Month) {
        return _buildMonthly(offset, timezone);
    }

    if (i === Granularity.ThreeMonth) {
        return _buildThreeMonth(offset, timezone);
    }

    if (i === Granularity.Week) {
        return _buildWeek(offset, timezone);
    }

    if (i === Granularity.Day) {
        return _buildDay(offset, timezone);
    }

    if (i === Granularity.Hour) {
        return _buildHour(offset, timezone);
    }

    return null;
};

const _buildHour = (
    offset: number,
    timezone: string
): DateInfoForGranularity => {
    const after = moment
        .utc()
        .subtract({ hours: 1 })
        .startOf("minute")
        .toDate();
    const endOfDate = moment
        .tz(after, "UTC")
        .add({
            hours: 1,
            milliseconds: 1,
        })
        .toDate();

    return {
        granularity: Granularity.Hour,
        dateTimeUnit: "minute",
        increment: 1,
        incrementMs: 60 * 1000,
        _afterUtc: after,
        _beforeUtc: endOfDate,
        afterTz: moment(after).clone().add(offset, "minutes").toDate(),
        beforeTz: moment(endOfDate).clone().add(offset, "minutes").toDate(),
        numberOfBuckets: null,
        timezone,
        offsetMinutes: offset,
    };
};

const _buildDay = (
    offset: number,
    timezone: string
): DateInfoForGranularity => {
    const after = moment
        .utc()
        .subtract({ hours: 24 })
        // make it rounded to the nearest 5 minutes
        .startOf("minute")
        .subtract({ minutes: moment.utc().minute() % 5 })
        .toDate();
    const endOfDate = moment
        .tz(after, "UTC")
        .add({
            hours: 24,
            milliseconds: 1,
        })
        .toDate();

    return {
        granularity: Granularity.Day,
        dateTimeUnit: "minute",
        increment: 5,
        incrementMs: 5 * 60 * 1000,
        _afterUtc: after,
        _beforeUtc: endOfDate,
        afterTz: moment(after).clone().add(offset, "minutes").toDate(),
        beforeTz: moment(endOfDate).clone().add(offset, "minutes").toDate(),
        numberOfBuckets: null,
        timezone,
        offsetMinutes: offset,
    };
};

const _buildWeek = (
    offset: number,
    timezone: string
): DateInfoForGranularity => {
    const after = DateTime.now().minus({ weeks: 1 }).startOf("day").toJSDate();
    const endOfDate = DateTime.now()
        .endOf("day")
        .plus({
            milliseconds: 1,
        })
        .toUTC()
        .toJSDate();

    return {
        granularity: Granularity.Week,
        dateTimeUnit: "hour",
        increment: 1,
        incrementMs: 60 * 60 * 1000,
        _afterUtc: after,
        _beforeUtc: endOfDate,
        afterTz: moment(after).clone().add(offset, "minutes").toDate(),
        beforeTz: moment(endOfDate).clone().add(offset, "minutes").toDate(),
        numberOfBuckets: null,
        timezone,
        offsetMinutes: offset,
    };
};

const _buildHourlyChunksForAnyGranularity = (
    poolCreated: Date,
    i: Granularity,
    offset: number,
    timezone: string
): DateInfoForGranularity => {
    // rounded to hour for all other periods
    const startDate = moment(poolCreated).startOf("hour").toDate();

    const endOfDate = DateTime.now()
        .endOf("day")
        .plus({
            milliseconds: 1,
        })
        .toUTC()
        .toJSDate();

    return {
        granularity: i,
        dateTimeUnit: "hour",
        increment: 1,
        incrementMs: 60 * 60 * 1000,
        _afterUtc: startDate,
        _beforeUtc: endOfDate,
        afterTz: moment(startDate).clone().add(offset, "minutes").toDate(),
        beforeTz: moment(endOfDate).clone().add(offset, "minutes").toDate(),
        numberOfBuckets: null,
        timezone,
        offsetMinutes: offset,
    };
};

const _old_buildAll = (
    createdAt: Date,
    timezone: string,
    offset: number
): DateInfoForGranularity => {
    const after = DateTime.fromJSDate(new Date(createdAt))
        .startOf("week")
        .toJSDate();

    const endOfDate = DateTime.now()
        .endOf("week")
        .plus({
            milliseconds: 1,
        })
        .toUTC()
        .toJSDate();

    return {
        granularity: Granularity.All,
        dateTimeUnit: "week",
        increment: 1,
        incrementMs: 7 * 24 * 60 * 60 * 1000,
        _afterUtc: after,
        _beforeUtc: endOfDate,
        afterTz: moment(after).clone().add(offset, "minutes").toDate(),
        beforeTz: moment(endOfDate).clone().add(offset, "minutes").toDate(),
        numberOfBuckets: null,
        timezone,
        offsetMinutes: offset,
    };
};

const _buildAllWithDaily = (
    offset: number,
    timezone: string,
    createdAt: Date
): DateInfoForGranularity => {
    const after = DateTime.fromJSDate(createdAt).startOf("day").toJSDate();

    const endOfDate = DateTime.now()
        .endOf("day")
        .plus({
            milliseconds: 1,
        })
        .toUTC()
        .toJSDate();

    return {
        granularity: Granularity.All,
        dateTimeUnit: "day",
        increment: 1,
        incrementMs: 24 * 60 * 60 * 1000,
        _afterUtc: after,
        _beforeUtc: endOfDate,
        afterTz: moment(after).clone().add(offset, "minutes").toDate(),
        beforeTz: moment(endOfDate).clone().add(offset, "minutes").toDate(),
        numberOfBuckets: null,
        timezone,
        offsetMinutes: offset,
    };
};

const _buildYearly = (
    offset: number,
    timezone: string
): DateInfoForGranularity => {
    const after = DateTime.now().minus({ years: 1 }).startOf("day").toJSDate();

    const endOfDate = DateTime.now()
        .endOf("day")
        .plus({
            milliseconds: 1,
        })
        .toUTC()
        .toJSDate();

    return {
        granularity: Granularity.Year,
        dateTimeUnit: "day",
        increment: 1,
        incrementMs: 24 * 60 * 60 * 1000,
        _afterUtc: after,
        _beforeUtc: endOfDate,
        afterTz: moment(after).clone().add(offset, "minutes").toDate(),
        beforeTz: moment(endOfDate).clone().add(offset, "minutes").toDate(),
        numberOfBuckets: null,
        timezone,
        offsetMinutes: offset,
    };
};

const _buildMonthly = (
    offset: number,
    timezone: string
): DateInfoForGranularity => {
    const after = DateTime.now().minus({ months: 1 }).startOf("day").toJSDate();
    const endOfDate = DateTime.now()
        .endOf("day")
        .plus({
            milliseconds: 1,
        })
        .toUTC()
        .toJSDate();

    return {
        granularity: Granularity.Month,
        dateTimeUnit: "hour",
        increment: 1,
        incrementMs: 60 * 60 * 1000,
        _afterUtc: after,
        _beforeUtc: endOfDate,
        afterTz: moment(after).clone().add(offset, "minutes").toDate(),
        beforeTz: moment(endOfDate).clone().add(offset, "minutes").toDate(),
        numberOfBuckets: null,
        timezone,
        offsetMinutes: offset,
    };
};

const _buildYTD = (
    offset: number,
    timezone: string
): DateInfoForGranularity => {
    const after = DateTime.now().startOf("year").toJSDate();
    const endOfDate = DateTime.now()
        .endOf("day")
        .plus({
            milliseconds: 1,
        })
        .toUTC()
        .toJSDate();

    return {
        granularity: Granularity.YearToDate,
        dateTimeUnit: "day",
        increment: 1,
        incrementMs: 24 * 60 * 60 * 1000,
        _afterUtc: after,
        _beforeUtc: endOfDate,
        afterTz: moment(after).clone().add(offset, "minutes").toDate(),
        beforeTz: moment(endOfDate).clone().add(offset, "minutes").toDate(),
        numberOfBuckets: null,
        timezone,
        offsetMinutes: offset,
    };
};

const _buildThreeMonth = (
    offset: number,
    timezone: string
): DateInfoForGranularity => {
    const after = DateTime.now().minus({ months: 3 }).startOf("day").toJSDate();
    const endOfDate = DateTime.now()
        .endOf("day")
        .plus({
            milliseconds: 1,
        })
        .toUTC()
        .toJSDate();

    return {
        granularity: Granularity.ThreeMonth,
        dateTimeUnit: "day",
        _afterUtc: after,
        increment: 1,
        incrementMs: 24 * 60 * 60 * 1000,
        _beforeUtc: endOfDate,
        afterTz: moment(after).clone().add(offset, "minutes").toDate(),
        beforeTz: moment(endOfDate).clone().add(offset, "minutes").toDate(),
        numberOfBuckets: null,
        timezone,
        offsetMinutes: offset,
    };
};
