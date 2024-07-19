import BigNumber from "bignumber.js";
import { isNil } from "lodash/fp";
import { DECIMAL_PLACES } from "src/utils";

export const BIG_NUMBER_TRANSFORMER = {
    from: (v) => (!isNil(v) ? new BigNumber(v) : null),
    // store 18 decimals of precision (biggest precision for any token)
    to: (v) => (!isNil(v) ? new BigNumber(v).toFixed(DECIMAL_PLACES) : null),
};
