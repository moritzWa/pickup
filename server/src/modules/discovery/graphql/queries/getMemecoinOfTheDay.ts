import { list, nonNull, nullable, objectType, queryField } from "nexus";
import { AccountProvider } from "src/core/infra/postgres/entities";

const AHSTEN = {
    contractAddress: "5n9Ega2ET6nxAfvJk6Bc5sJ4fhueGxBinWym2a1YNWPU",
    symbol: "PEWERS",
    name: "Ahsten Pewers",
    description:
        "Still on Pump.Fun, Ahsten has built a community of hundreds of followers. They just need to reach $69K to be listed on Jupiter + Movement!",
    // "BONK took the Solana ecosystem by storm when they airdropped half their airdrop supply to...",
    color1: "rgb(127,112,147)",
    color2: "rgb(101, 107, 251)",
    provider: AccountProvider.Solana,
    iconImageUrl:
        "https://statics.solscan.io/cdn/imgs/s60?ref=68747470733a2f2f63662d697066732e636f6d2f697066732f516d575539356d6d38433851334d6369684c4838684a506e6e636a41376b5944686f6f66726161544d5067333432",
    url: "https://pump.fun/5n9Ega2ET6nxAfvJk6Bc5sJ4fhueGxBinWym2a1YNWPU",
};

const DEFIANT = {
    contractAddress: "2aKL4cjZBhR1bPwhpwX87kZpat1gy2KRphfc4ARTrDDt",
    symbol: "ANT",
    name: "DefiANT",
    description:
        "DefiANT is a coin created by reputed media source Defiant. The only tokens the team has are the 0.6% of the supply for the article author who launched the token (as per pumpfun standard launch process), and tokens other team members bought in the open market.",
    // "BONK took the Solana ecosystem by storm when they airdropped half their airdrop supply to...",
    color1: "rgb(136,174,83)",
    color2: "rgb(143, 34, 19)",
    provider: AccountProvider.Solana,
    iconImageUrl:
        "https://cdn.helius-rpc.com/cdn-cgi/image//https://cf-ipfs.com/ipfs/QmUQynyTpNXUy3JS84Ze58bX6VRCYmcaGwZxa7YQHP9TD5",
};

const THOLANA = {
    contractAddress: "EKCW975DWdt1roK1NVQDf4QGfaGTcQPU5tFD1DMcMe9Q",
    symbol: "THOL",
    name: "Tholana",
    description:
        "Tholana is a memefied version of Mike Tyson. His next fight is on July 20th against Jake Paul.",
    // "BONK took the Solana ecosystem by storm when they airdropped half their airdrop supply to...",
    color1: "rgb(20,20,10)",
    color2: "rgb(143, 34, 19)",
    provider: AccountProvider.Solana,
    iconImageUrl:
        "https://cdn.helius-rpc.com/cdn-cgi/image//https://gateway.irys.xyz/SeNZkL4N4x52OOUlydfcdvsCLk0D8q32PSUWvo5fgRA",
};

const POPCAT = {
    contractAddress: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    symbol: "POPCAT",
    name: "Popcat",
    description:
        "Popcat is based on a popular meme of a cat chirping at birds. The meme went viral on Twitter, racking up tens of thousands of likes.",
    // "BONK took the Solana ecosystem by storm when they airdropped half their airdrop supply to...",
    color1: "rgb(20,10,10)",
    color2: "rgb(143, 34, 19)",
    provider: AccountProvider.Solana,
    iconImageUrl:
        "https://cdn.helius-rpc.com/cdn-cgi/image//https://arweave.net/A1etRNMKxhlNGTf-gNBtJ75QJJ4NJtbKh_UXQTlLXzI",
};

const JEO_BODEN = {
    contractAddress: "3psH1Mj1f7yUfaD5gh6Zj7epE8hhrMkMETgv5TshQA4o",
    symbol: "boden",
    name: "jeo boden",
    description:
        "Jeo Boden is a comical representation of president Joe Biden. After growing 1,000% and going viral on Tik Tok, jeo boden has established itself as a dominant coin on Solana.",
    // "BONK took the Solana ecosystem by storm when they airdropped half their airdrop supply to...",
    color1: "rgb(23,24,52)",
    color2: "rgb(143, 34, 19)",
    provider: AccountProvider.Solana,
    iconImageUrl:
        "https://cdn.helius-rpc.com/cdn-cgi/image//https://bafkreid2t4f3i36tq4aowwaaa5633ggslefthxfdudaimog6unwu36umha.ipfs.nftstorage.link",
};

const MEMECOIN_OF_THE_DAY = AHSTEN;

//

// WEN: WEN is the coin that Jupiter airdropped to the Solana ecosystem before the famous launch of its token $JUP."

export const GetMemecoinOfTheDayResponse = objectType({
    name: "GetMemecoinOfTheDayResponse",
    definition(t) {
        t.nonNull.string("contractAddress");
        t.nonNull.string("symbol");
        t.nonNull.string("name");
        t.nonNull.string("description");
        t.nonNull.string("color1");
        t.nonNull.string("color2");
        t.nonNull.string("iconImageUrl");
        t.nonNull.string("url");
        t.field("provider", { type: nonNull("AccountProviderEnum") });
    },
});

export const getMemecoinOfTheDay = queryField("getMemecoinOfTheDay", {
    type: nonNull("GetMemecoinOfTheDayResponse"),
    resolve: async (_parent, args, ctx) => {
        // throwIfNotAuthenticated(ctx);
        // const user = ctx.me!;

        return MEMECOIN_OF_THE_DAY;
    },
});
