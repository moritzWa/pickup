import BigNumber from "bignumber.js";
import { DECIMAL_PLACES } from ".";

export const DEFAULT_ROUNDING_MODE = BigNumber.ROUND_HALF_CEIL;

BigNumber.config({
    ROUNDING_MODE: DEFAULT_ROUNDING_MODE,
    DECIMAL_PLACES: DECIMAL_PLACES,
});
