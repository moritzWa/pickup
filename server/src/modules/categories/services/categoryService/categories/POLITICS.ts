import { CategoryToken, Category } from "./types";

// includes unverified
const POLITICS_ALL: CategoryToken[] = [
    {
        name: "Donald Trump",
        twitter: "https://twitter.com/dolandtremp_sol/",
        website: "https://tremp.xyz/",
        contractAddress: "FU1q8vJpZNUrmqsciSjp8bAKKidGsLmouB8CBdf8TKQv",
        verified: false,
    },
    {
        name: "Joe Biden",
        twitter: "https://twitter.com/boden4pres/",
        website: "https://www.boden4pres.com/",
        contractAddress: "3psH1Mj1f7yUfaD5gh6Zj7epE8hhrMkMETgv5TshQA4o",
        verified: false,
    },
    {
        name: "Elizabeth Warren",
        twitter: "https://twitter.com/WhorenOnSol/",
        website: "https://elizabathwhoren.com/",
        contractAddress: "EF23Avq2cTPnMVTfHacZ3SG5Z8misHmFA2gbt2rKqiYH",
        verified: false,
    },
    {
        name: "Tucker Carlson",
        twitter: "https://twitter.com/tookerkurlson/",
        website: "https://www.tookerkurlson.com/",
        contractAddress: "9EYScpiysGnEimnQPzazr7Jn9GVfxFYzgTEj85hV9L6U",
        verified: false,
    },
    {
        name: "Barron Trump",
        twitter: "https://twitter.com/barrtremp_sol/",
        contractAddress: "2CMxmFb2nsNdw351TfZoawpN1DnDuVrH4Wn6fxH2EJT6",
        verified: false,
    },
    {
        name: "Melania Trump",
        twitter: "https://twitter.com/WEFofTREMPonSOL/",
        website: "https://melenyetremp.xyz/",
        contractAddress: "Cer9R2rqUEyemrgCWu5SsJu5d52sdZfC2gCYpwBhtEbB",
        verified: false,
    },
    {
        name: "Make America Great Again",
        twitter: "https://twitter.com/TrumpSolMAGA/",
        website: "https://www.trumpmaga.ca/",
        contractAddress: "TrumptpNNBEgVjDc8bnemRTNYZKhdsst9ujNAnTSHqp",
        verified: false,
    },
    {
        name: "United Kingdom",
        twitter: "https://twitter.com/brexitonsol/",
        website: "https://unitidkengdum.onsolana.lol/",
        contractAddress: "DB34KWhcH7bqsbA7nReDk2VBUexKbWa18dVvfD8XC8xP",
        verified: false,
    },
    {
        name: "Barack Obama",
        twitter: "https://twitter.com/borackomaba_sol/",
        website: "omaba2024.com",
        contractAddress: "AZ7ABJtSeZoFHhNzWhMVREMgGKZVCN8nEZwQfyZdALSZ",
        verified: false,
    },
];

export const POLITICS: Category = {
    tokens: POLITICS_ALL,
    name: "Politics",
};
