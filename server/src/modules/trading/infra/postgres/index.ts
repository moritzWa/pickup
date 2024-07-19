import {
    Quote,
    Swap,
    SwapEvent,
    SwapFee,
    Token,
} from "src/core/infra/postgres/entities";
import { PostgresSwapRepository } from "./swapRepo";
import { PostgresTokenRepository } from "./tokenRepo";
import { PostgresQuoteRepository } from "./quoteRepo";
import { PostgresSwapEventRepository } from "./swapEventRepo";
import { PostgresSwapFeeRepository } from "./swapFeeRepo";

export const swapRepo = new PostgresSwapRepository(Swap);
export const tokenRepo = new PostgresTokenRepository(Token);
export const quoteRepo = new PostgresQuoteRepository(Quote);
export const swapEventRepo = new PostgresSwapEventRepository(SwapEvent);
export const swapFeeRepo = new PostgresSwapFeeRepository(SwapFee);
