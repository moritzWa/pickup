import BigNumber from "bignumber.js";
import * as numbro from "numbro";
import { CurrencyCode } from "src/shared/domain";
import { D } from "src/utils";

export const formatPrice = (priceDollarsUsd: number) => {
    const n = numbro as any; // numbro types are annoying, this works tho
    if (new BigNumber(priceDollarsUsd).lte(0.01)) {
        return "$" + n(priceDollarsUsd ?? 0).format("0,0.[00000000]");
    }

    return D(priceDollarsUsd * 100, CurrencyCode.USD).toFormat();
};
