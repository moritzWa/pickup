import {
    failure,
    failureAndLog,
    FailureOrSuccess,
    guardSwitch,
    Maybe,
    success,
} from "src/core/logic";
import { DefaultErrors, UnexpectedError } from "src/core/logic/errors";
import Dinero from "dinero.js";
import { isNil } from "lodash/fp";
import { isUndefined } from "lodash";
import BigNumber from "bignumber.js";
import { AxiosInstance } from "axios";
import { IAxiosRetryConfig } from "axios-retry";
import { DateTime } from "luxon";
import { StatusCodes } from "http-status-codes";
import * as numbro from "numbro";

export const ZERO = (currency?: Dinero.Currency) =>
    Dinero({ amount: 0, currency: currency });
export const ZERO_BN = new BigNumber(0);

export const DECIMAL_PLACES = 19; // 1 decimals more

export const safelyLogStringSize = (msg: string, chunks: any) => {
    try {
        const size = Buffer.byteLength(JSON.stringify(chunks));

        console.log(`[chunk data for ${msg} is ${formatBytes(size)}]`);
    } catch (err) {
        debugger;
        // do nothing
    }
};

export type DeepPartial<T> = T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;

export const sumToBigNumber = (numbers: number[]): BigNumber =>
    sumBigNumbers(numbers.map((n) => new BigNumber(n)));

export const sumBigNumbers = (numbers: BigNumber[]): BigNumber => {
    if (!numbers.length) return new BigNumber(0);
    return numbers.reduce((acc, n) => acc.plus(n), new BigNumber(0));
};

const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?Z$/;
// This function is used by json parse to transform
// string values that look like dates into JS objects
// Note: this is particularly useful for our envelopes we send to SQS
function dateReplacer(_, value): any {
    if (typeof value === "string" && dateFormat.test(value)) {
        return new Date(value);
    }
    return value;
}

export function isValidEmail(email: string): boolean {
    const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return regex.test(email);
}

const camelToSnakeCase = (str: string): string =>
    str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

// cents
export function D(
    cents: number,
    currency: Maybe<Dinero.Currency>
): Dinero.Dinero {
    return Dinero({
        amount: Math.round(cents || 0),
        currency: currency || "USD",
    });
}

// dollars
export function DD(
    dollars: number,
    currency: Maybe<Dinero.Currency>
): Dinero.Dinero {
    return Dinero({
        amount: Math.round(dollars * 100),
        currency: currency || "USD",
    });
}

const centsToDinero = (cents: number, currency: Dinero.Currency = "USD") =>
    Dinero({ amount: cents, currency });

const dollarsToDinero = (dollars: number, currency?: Dinero.Currency) =>
    Dinero({ amount: Math.round(dollars * 100), currency });

const capitalize = (str: string) => str.split(" ").map(_word).join(" ");

export const absDinero = (d: Dinero.Dinero): Dinero.Dinero =>
    Dinero({
        amount: Math.abs(d.getAmount()),
        currency: d.getCurrency(),
    });

const _word = (str: string) =>
    str.toUpperCase().charAt(0) + str.toLowerCase().slice(1);

/**
 * Safely stringifies json. This function does not throw, just returns
 * a failure or success obj
 *
 * @param json the json
 * @returns the stringified json
 */
const maybeStringifyJSON = (
    json: any
): FailureOrSuccess<Error | UnexpectedError, string> => {
    try {
        const message = JSON.stringify(json);

        return success(message);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const maybeParseJSON = <T>(
    json: Maybe<string>,
    replacer: (key: string, value: string) => any = dateReplacer
): FailureOrSuccess<DefaultErrors, Maybe<T>> => {
    try {
        if (!json) {
            return success(null);
        }

        const parsed = JSON.parse(json, replacer);
        return success(parsed as unknown as T);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const stripUndefined = (obj?: Object): Object => {
    if (!obj) return {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key) && obj[key] === undefined) {
            delete obj[key];
        }
    }
    return obj;
};

const getValue = <T>(val: T): Exclude<T | undefined, null> => {
    // for null or undefined returns undefined
    if (isNil(val)) {
        return undefined;
    }

    return val as Exclude<T | undefined, null>;
};

/*  Success / failure wrapper
 *
 */
const trySuccessFailHelper = async (
    fxn: (...params: any) => any,
    shouldLog: boolean
): Promise<FailureOrSuccess<DefaultErrors, any>> => {
    try {
        return await fxn();
    } catch (err) {
        console.error(err);
        const error = new UnexpectedError(err);
        if (shouldLog) {
            return await failureAndLog({
                error,
                message: error.message,
            });
        } else {
            return failure(error);
        }
    }
};

const trySuccessFail = async (fxn: (...params: any) => any) =>
    trySuccessFailHelper(fxn, false);

const trySuccessFailAndLog = async (fxn: (...params: any) => any) =>
    trySuccessFailHelper(fxn, true);

type ObjectKey = string | number | symbol;

export const groupBy = <
    K extends ObjectKey,
    TItem extends Record<K, ObjectKey>
>(
    items: TItem[],
    key: K
): Record<ObjectKey, TItem[]> =>
    items.reduce(
        (result, item) => ({
            ...result,
            [item[key]]: [...(result[item[key]] || []), item],
        }),
        {} as Record<ObjectKey, TItem[]>
    );

// isOneToOneSubset
export const isOneToOneSubset = (
    superset: number[],
    subset: number[]
): boolean => {
    return false;
};

// this will run a function IF it exists. so if you want to run a function on a map that may or not exist,
// use this
export const runMapFxn =
    <T>(fxn?: (t: T) => T) =>
    (t: T) =>
        fxn ? fxn(t) : t;

export function get<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

export type RecursivePicker<T> = {
    [K in keyof T]?: T[K] extends object | undefined
        ? RecursivePicker<T[K]>
        : true;
};

export const Helpers = {
    ZERO_BN,
    sumToBigNumber,
    capitalize,
    groupBy,
    camelToSnakeCase,
    maybeParseJSON,
    maybeStringifyJSON,
    stripUndefined,
    getValue,
    money: {
        centsToDinero,
        dollarsToDinero,
    },
    trySuccessFail,
    trySuccessFailAndLog,
};

export const removeUTFFromString = (str: string): string => {
    // if (str === null || str === undefined) return null;
    return str
        .replace(/\u0000/g, "")
        .replace(/\u0001/g, "")
        .replace(/\u0002/g, "");
};

export function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = [
        "Bytes",
        "KiB",
        "MiB",
        "GiB",
        "TiB",
        "PiB",
        "EiB",
        "ZiB",
        "YiB",
    ];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// FIXME: also change this on the backend
export const getCurrencySymbol = (currency: Dinero.Currency) => {
    switch (currency) {
        case "USD":
        default:
            return "$";
    }
};

export const cleanBlockNumber = (
    amount: Maybe<string | number>
): Maybe<number> => {
    if (amount === null) {
        return null;
    }

    const isHex = amount.toString().startsWith("0x");

    if (isHex) {
        return new BigNumber(amount, 16).toNumber();
    }
    // otherwise return base 10
    return new BigNumber(amount).toNumber();
};

export const blockNumberToHex = (
    amount: Maybe<string | number>
): Maybe<string> => {
    if (amount === null) {
        return null;
    }

    const isHex = amount.toString().startsWith("0x");

    if (isHex) {
        return new BigNumber(amount, 16).toString();
    }
    // otherwise return base 10
    return "0x" + new BigNumber(amount).toString(16);
};

export const hexToBase10 = (d: string): number => {
    if (d.slice(0, 2) === "0x") {
        const number = d.slice(2);
        return new BigNumber(number, 16).toNumber();
    }
    return new BigNumber(d, 16).toNumber();
};

export function logSizeOfList(clientId: string, list: any[]) {
    try {
        const jsonString = JSON.stringify(list);
        const bytes = new TextEncoder().encode(jsonString).length;
        const megabytes = bytes / 1024 / 1024;
        // console.log(`Size of list: ${megabytes.toFixed(2)} MB`);
    } catch (err) {
        console.error(err);
    }
}

export function sizeOfList(list: any[]) {
    try {
        const jsonString = JSON.stringify(list);
        const bytes = new TextEncoder().encode(jsonString).length;
        const megabytes = bytes / 1024 / 1024;
        return megabytes;
    } catch (err) {
        console.error(err);
        return 0;
    }
}

export const formatNum = (n: number, isDollar = false, format?: string) => {
    if (n < 1e3) {
        // @ts-ignore
        return numbro(n).format(format || (isDollar ? "0,000.00" : "0.[00]"));
    }
    if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
    if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
    if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
    if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
};
