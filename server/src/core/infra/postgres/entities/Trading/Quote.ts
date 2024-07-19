import { Maybe } from "src/core/logic";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
    Relation,
} from "typeorm";
import { AccountProvider, TradingProvider } from "../types";
import { Helpers } from "src/utils";
import { Dictionary, isString } from "lodash";
import { BIG_NUMBER_TRANSFORMER } from "../utils";
import BigNumber from "bignumber.js";
import { TradingQuote } from "src/modules/trading/services/tradingProviders/types";

type RawQuoteData = TradingQuote;

export type QuoteTradingFee = {
    type: "token_account";
    tokenContractAddress: string;
    symbol: string;
    feeFiatAmountCents: BigNumber | number;
    amount: BigNumber | number;
};

@Entity({
    name: "quotes",
})
export class Quote {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: true,
        type: "enum",
        enum: TradingProvider,
        enumName: "trading_provider_enum",
        name: "provider",
    })
    provider!: TradingProvider;

    @Column({
        nullable: false,
        type: "text",
        name: "chain",
    })
    chain!: AccountProvider;

    @Column({
        nullable: true,
        type: "numeric",
        name: "platform_fee_bps",
    })
    platformFeeBps!: number;

    @Column({
        nullable: true,
        type: "numeric",
        name: "estimated_fee_value_cents",
    })
    estimatedFeeValueCents!: number;

    @Column({
        nullable: false,
        type: "text",
        name: "send_symbol",
    })
    sendSymbol!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "receive_symbol",
    })
    receiveSymbol!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "send_token_contract_address",
    })
    sendTokenContractAddress!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "receive_token_contract_address",
    })
    receiveTokenContractAddress!: string;

    @Column({
        nullable: true,
        type: "text",
        name: "send_icon_image_url",
    })
    sendIconImageUrl!: Maybe<string>;

    @Column({
        nullable: true,
        type: "text",
        name: "receive_icon_image_url",
    })
    receiveIconImageUrl!: Maybe<string>;

    @Column({
        nullable: false,
        type: "numeric",
        name: "send_amount",
        transformer: BIG_NUMBER_TRANSFORMER,
    })
    sendAmount!: BigNumber;

    @Column({
        nullable: false,
        type: "numeric",
        name: "receive_amount",
        transformer: BIG_NUMBER_TRANSFORMER,
    })
    receiveAmount!: BigNumber;

    @Column({
        nullable: false,
        type: "numeric",
        name: "send_fiat_amount_cents",
        transformer: BIG_NUMBER_TRANSFORMER,
    })
    sendFiatAmountCents!: BigNumber;

    @Column({
        nullable: false,
        type: "numeric",
        name: "receive_fiat_amount_cents",
        transformer: BIG_NUMBER_TRANSFORMER,
    })
    receiveFiatAmountCents!: BigNumber;

    @Column({
        nullable: false,
        type: "text",
        name: "send_fiat_currency",
    })
    sendFiatCurrency!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "receive_fiat_currency",
    })
    receiveFiatCurrency!: string;

    @Column({
        nullable: true,
        type: "numeric",
        name: "recommended_slippage_bps",
    })
    recommendedSlippageBps!: Maybe<number>;

    @Column({
        nullable: false,
        type: "numeric",
        name: "estimated_swap_fiat_amount",
    })
    estimatedSwapFiatAmountCents!: number;

    @Column({
        nullable: true,
        default: null,
        type: "jsonb",
        name: "fees",
        // transform the raw data (if it is stringified)
        transformer: {
            from: (rawData) => {
                // if stringified, try to parse the JSON
                if (isString(rawData)) {
                    const parse = Helpers.maybeParseJSON(rawData);
                    if (parse.isSuccess()) {
                        return parse.value;
                    }
                }

                return rawData;
            },
            to: (rawData) => rawData,
        },
    })
    fees!: Maybe<QuoteTradingFee[]>;

    @Column({
        nullable: false,
        type: "jsonb",
        name: "data",
        // transform the raw data (if it is stringified)
        transformer: {
            from: (rawData) => {
                // if stringified, try to parse the JSON
                if (isString(rawData)) {
                    const parse = Helpers.maybeParseJSON(rawData);
                    if (parse.isSuccess()) {
                        return parse.value;
                    }
                }

                return rawData;
            },
            to: (rawData) => rawData,
        },
    })
    rawData!: Maybe<RawQuoteData>;

    // When the transaction actually happened on the blockchain / exchange
    // Note: no default on purpose so it forces the client to specify the date
    // as it can be from an external system
    @Column({
        nullable: false,
        type: "timestamp",
        name: "created_at",
    })
    createdAt!: Date;

    // Note: no default on purpose so it forces the client to specify the date
    // as it can be from an external system
    @Column({
        nullable: false,
        type: "timestamp",
        name: "updated_at",
    })
    updatedAt!: Date;
}
