import { failure, success } from "src/core/logic";
import {
    Position,
    TradingIntegrationProviderService,
    TradingPositionInfo,
} from "../../types";
import { HeliusTokenMetadata, helius } from "src/utils";
import BigNumber from "bignumber.js";
import { MagicUserMetadata, WalletType } from "@magic-sdk/admin";
import { connect } from "src/core/infra/postgres";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { WRAPPED_SOL_MINT } from "./constants";
import { keyBy } from "lodash";
import { TOKEN_OVERRIDES } from "./contracts";
import { STABLE_COIN_IDENTIFIERS } from "src/shared/domain/stablecoins";

export const getPositions: TradingIntegrationProviderService["getPositions"] =
    async (walletAddress: string) => {
        const walletPositionsResponse = await helius.wallets.allBalances(
            walletAddress
        );

        if (walletPositionsResponse.isFailure()) {
            return failure(walletPositionsResponse.error);
        }

        const { balances, nativeBalance } = walletPositionsResponse.value;

        // const metadataResponse = await helius.tokens.metadataDAS(
        //     balances.map((b) => b.id)
        // );

        // const metadataByContract = metadataResponse.isSuccess()
        //     ? keyBy(metadataResponse.value, (r) => r.id)
        //     : {};

        const positions: Position[] = [
            ...balances.map((p): Position => {
                const override = TOKEN_OVERRIDES[p.id];
                const isNativeToken = p.id === WRAPPED_SOL_MINT;
                const canSelectToken =
                    isNativeToken ||
                    STABLE_COIN_IDENTIFIERS.has(
                        `${AccountProvider.Solana}:${p.id}`
                    );
                const cdnUrl = (p?.content?.files || [])[0]?.cdn_uri || null;

                return {
                    isNativeToken: p.id === WRAPPED_SOL_MINT,
                    symbol: override?.symbol || p.token_info.symbol || "",
                    iconImageUrl:
                        override?.iconImageUrl ||
                        cdnUrl ||
                        p.content.links.image ||
                        null,
                    amount: new BigNumber(p.token_info.balance).div(
                        new BigNumber(10).pow(p.token_info.decimals)
                    ),
                    provider: AccountProvider.Solana,
                    contractAddress: p.id,
                    coingeckoTokenId: null,
                    canSelectToken: canSelectToken,
                };
            }),
            {
                symbol: "SOL",
                isNativeToken: true,
                amount: nativeBalance,
                iconImageUrl: "https://assets.awaken.tax/icons/solana.png",
                coingeckoTokenId: null,
                contractAddress: WRAPPED_SOL_MINT,
                provider: AccountProvider.Solana,
                canSelectToken: true,
            },
        ];

        const validPositions = positions.filter((p) =>
            p.amount.isGreaterThan(0)
        );

        const value: TradingPositionInfo = {
            positions: validPositions,
            publicKey: walletAddress,
            provider: AccountProvider.Solana,
        };

        return success(value);
    };

if (require.main === module) {
    connect()
        .then(async () => {
            // const magic = await getMagic();
            // const user = await magic.users.getMetadataByIssuerAndWallet(
            //     "did:ethr:0xa6A9926ccA8818a3C88C729C017Cd70685105C64",
            //     WalletType.SOLANA
            // );
            // const solanaWallet = user.wallets?.find(
            //     (w: any) =>
            //         w.wallet_type === WalletType.SOLANA ||
            //         w.walletType === WalletType.SOLANA
            // ) as any;
            // const walletAddress =
            //     solanaWallet.publicAddress || solanaWallet.public_address;
            // // const user = await magic.
            const response = await getPositions(
                "8ewYNc5eBWR7vNGnTS45Kw8ZwunnttCpHnE9XGg1aMgX"
            );
            debugger;
        })
        .catch(console.error)
        .finally(() => process.exit(1));
}
