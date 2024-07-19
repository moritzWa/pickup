import { connect } from "src/core/infra/postgres";
import { AccountProvider, Airdrop } from "src/core/infra/postgres/entities";
import { airdropRepo } from "src/modules/airdrops/infra/postgres";
import { magic } from "src/utils/magic";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { v4 as uuidv4 } from "uuid";

export const run = async () => {
    const airdropResponse = await airdropRepo.create({
        id: uuidv4(),
        symbol: "$MEW",
        airdropPubkey: null,
        provider: AccountProvider.Solana,
        contractAddress: "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5",
        totalAmount: 5_000_000,
        amountPerClaim: 5_000,
        iconImageUrl:
            "https://cdn.helius-rpc.com/cdn-cgi/image//https://bafkreidlwyr565dxtao2ipsze6bmzpszqzybz7sqi2zaet5fs7k53henju.ipfs.nftstorage.link",
        // start date April 1st
        // end date June 1st
        startDate: new Date("2024-04-01"),
        endDate: new Date("2024-06-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    debugger;
    console.log(airdropResponse);
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING MAKE AIRDROP =====");
        console.error(err);
        process.exit(1);
    });
