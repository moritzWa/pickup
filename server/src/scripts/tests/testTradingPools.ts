// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/{date}_{file_name}.ts

import BigNumber from "bignumber.js";
import { connect } from "src/core/infra/postgres";
import { AccountProvider, TradingSide } from "src/core/infra/postgres/entities";
import { hasValue } from "src/core/logic";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { getCreatedAts } from "src/modules/discovery/services/discoveryService/syncJupiterTokensService/updateJupiterCreatedAt";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { quoteRepo } from "src/modules/trading/infra/postgres";
import { QuoteService } from "src/modules/trading/services";
import { SolanaTradingService } from "src/shared/integrations/providers/solana";
import { coingecko, helius } from "src/utils";
import { v4 as uuidv4 } from "uuid";

export const run = async () => {
    await SolanaTradingService.getTokenInfo(
        "3S8qX1MsMqRbiwKg2cQyx7nis1oHMgaCuc9c4VfvVdPN"
    );

    debugger;

    const tokensPage = [
        "B7DZ838cTNUo5reNxTyKMXDre7FtwoxHvLiwuVJEoaaT",
        "9XkZcHApwYzQyVh2UaDDv6R4Hqnh43ws4BxLGTiwyqSH",
        "JAifFyBeyYLvkcn5Wrd2NfNdtK2nBq5Wf1WMYrqTuZwy",
        "8bavojDHPsDYAbMj84JRVtFcssJbgx7YCxCYioAHRj6B",
        "4KruhtSf46CTCwtdY9qPzqmUisSxQkWf2Hk1MccGCVab",
        "B7LieLvvCk2JcKNg4cVnMvi6eki2FUJa5NnjxvaCfBnF",
        "4tqtkQV63xDGntLG3YS4dGVmSVzoWm2VuwTtPfMyt1EL",
        "5YvkNxVNQtUUzDV9pSCmHuphHdwyg6YyGxBhnJyVNs3B",
        "HsUtR6g3HS77dMzTacqN6F98Ed4cmPU2kipxX4cQzjXP",
        "6nRM6G1Xz6xYs7LuSbjje4qJmt7tgWnfm8J9CkjA27NT",
        "7nZsUFJpXdEyWD2Xk2p9TFVjWDivwB9gVzp5V7xULPgi",
        "FsQovhphjExVZTAspUKjYe1VhsHucshNj9P9VFRmyiiT",
        "BSKJvLPc6BeJMw23fDsSmyY6agWGdSpXzY4QnwMVHjKZ",
        "DmrrCGDihHpQWEMWwLHjULk74TxvccHXzARUtxJQ2CT3",
        "akkfm7RGm5S85o1o1Uda5z8s8L3dyWvjMaLHq9vnBLH",
        "7kopcz4HqC2hG3XqvGk83GpGWZUtpzZPMEQsDN6G2GYy",
        "8aohkopoJNXDcf1Hge6SuHnZwnbz46cWPzH9RhXrXz85",
        "vHWgxQf6G3fm87k86QEvp3pmuER1KnrBwdCKfGjcsqw",
        "7wPRZTabWHBR1T9bRfiXVuqKvYGzhRemCsoraqdXxsog",
        "8xJsJfsBJm45d84yx4xdbHud43CMKvahB8MsAnMx48Qs",
        "4npZsH2YfDV54JEZLdEkFKVYmT3YQkn1bHNBUdF8U3s9",
        "FRLsusPSVGHSXC8S4d1ZKDLAyV4GumXi4h6FXstPdbaG",
        "GkecicGBfYKWfnxthH3sbCmVmrsX2Sgdq4ekT5cBFN3N",
        "65wP7CSyz1mn6CC3tpkr4swWHWzsCv3PGFcPsyYbk8DB",
        "3q4HkcD2tuUxqCR3wTR7NZR5iuhmymd1FdBdJeK45FAU",
        "3C31oMh4XL95rHvwR4cZHPvWV3ygPUUyqwzteDRCRhW4",
        "9JQcaDJigQq83PvTG2MBh8s1MB4yyiX5zB7JJ6nc5wvR",
        "FBTDtY6kZKmAmqQHstgS9RSKQfbacVP6mSs8NVwh1BFP",
        "GaY2YH8CmJTKRc1yXXbLTVoC3T3kEtbv6wzg9kP6JQht",
        "4bujERDJfKxrzd9CNNqEFoFQnMEMEabD7UWF9XLrqdBg",
    ];

    const createdAtsResp = await getCreatedAts(
        tokensPage.map((p) => ({ contractAddress: p }))
    );

    debugger;

    console.log(createdAtsResp);
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
