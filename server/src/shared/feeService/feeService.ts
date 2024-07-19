import { AccountProvider, TradingSide } from "src/core/infra/postgres/entities";
import { STABLE_COIN_IDENTIFIERS } from "../domain/stablecoins";
import BigNumber from "bignumber.js";
import { SOL_USDC_MINT } from "../integrations/providers/solana/constants";
import { canCollectFeeForSOLMint } from "src/utils/jupiter";

const getFeeBps = () => {
    return 100;
};

// the amount of fee we are taking from the send amount specifically
const getSendTokenFeeAmount = async ({
    side,
    sendTokenContractAddress,
    amount,
    chain,
    feeBps,
}: {
    side: TradingSide;
    chain: AccountProvider;
    sendTokenContractAddress: string;
    amount: BigNumber;
    feeBps: number;
}): Promise<BigNumber> => {
    if (side === TradingSide.Sell) {
        return new BigNumber(0);
    }

    // ex. 100 BPS = 0.01 (1 %)
    const feeBpsMultiplier = new BigNumber(feeBps).div(100).div(100);

    if (chain === AccountProvider.Solana) {
        const canCollectFee: boolean = await canCollectFeeForSOLMint(
            sendTokenContractAddress
        );

        if (!canCollectFee) {
            return new BigNumber(0);
        }

        return amount.multipliedBy(feeBpsMultiplier);
    }

    return new BigNumber(0);
};

export const FeeService = {
    getFeeBps,
    getSendTokenFeeAmount,
};
