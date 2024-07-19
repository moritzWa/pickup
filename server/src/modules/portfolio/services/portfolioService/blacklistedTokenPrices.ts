import { AccountProvider } from "src/core/infra/postgres/entities";

export const BLACKLISTED_TOKEN_PRICES = new Set([
    // samokiller
    `${AccountProvider.Solana}:Samo5dHL9cvhF5VxoWsMjCLzFyaw9QMhJbd17SSLT2t`,
    // bonkkiller
    `${AccountProvider.Solana}:mDBNSUv8LZzktDAGpDJVRWSfCpCjgeDeHYkeHtz97ka`,
    // bomekiller
    `${AccountProvider.Solana}:E6TaFQHpSC3LY3YahaYopx8FKwKDVEuDruaa3o4UTvGP`,
    // trump sol
    `${AccountProvider.Solana}:TRumPa4rP7CXuNBYfM3aAUgcwRMTUh5JdP9JzpYEjFm`,
]);
