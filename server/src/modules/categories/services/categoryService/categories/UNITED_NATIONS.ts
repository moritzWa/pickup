import { Category, CategoryToken } from "./types";

// includes unverified
const UNITED_NATIONS_ALL: CategoryToken[] = [
    {
        name: "Russia",
        twitter: "https://twitter.com/RussiaSolana/",
        website: "https://www.russiacoinsol.com/",
        contractAddress: "36JQHwN2EgP9sKkCHn7axdpBxyLT8JUfiCnqHoy5r83R",
        verified: true, // nationfi
    },
    {
        name: "New Zealand",
        twitter: "https://twitter.com/NewZealandSol/",
        contractAddress: "9NQTAxdWAV8moypBkx6MtehRehAmeoKUK5YcJvkP4v6g",
        verified: true, // nationfi
    },
    {
        name: "Philippines",
        twitter: "https://twitter.com/PinoyCoinSol/",
        website: "https://pinoycoin.xyz/",
        contractAddress: "9PeGEcSeVnPFE9SRHA1dFvKGEEyZnAbzRQjhkumKd7E6",
        verified: true, // nationfi
    },
    {
        name: "Serbia",
        twitter: "https://twitter.com/Serbia_sol/",
        website: "https://www.serbiasol.com/",
        contractAddress: "Z83FZhr44ks3iQyJs4GEFRuq2fy82H2ha6wtUtpRqSF",
        verified: true, // nationfi
    },
    {
        name: "Hong Kong",
        twitter: "https://twitter.com/HongKongOnSol/",
        website: "https://www.hongkongcoin.site/",
        contractAddress: "2QnSmbcbrfoxfCvr9iQpn4bWpBkzDvwGm47PjkZGU3HS",
        verified: true, // nationfi
    },
    {
        name: "Mongolia",
        twitter: "https://twitter.com/MongoliaCoin/",
        website: "https://mongoliacoin.net/",
        contractAddress: "DsHup7A95J3r2DaaN3nT6fVet8QAKq2jC8vMUGgyCBYM",
        verified: false,
    },
    {
        name: "Tuvalu",
        twitter: "https://twitter.com/Tuvaluonsol/",
        website: "https://www.tuvaluonsol.tv/",
        contractAddress: "6tCpSeeaatDCo4Ue14VhkwM17YjsPCgcxGoh1ZZWwXVj",
        verified: true, // nationfi
    },
    // {
    //     name: "Ethiopia",
    //     twitter: "https://twitter.com/ethiopian_sol/",
    //     verified: false,
    // },
    {
        name: "England",
        twitter: "https://twitter.com/ENG_on_sol/",
        website: "https://www.englandonsol.site/",
        contractAddress: "4XQvdipJBdrb5hUgUrbZPPFmp6BCav41n55dc7KDYW3m",
        verified: true, // nationfi
    },
    {
        name: "Cuba",
        twitter: "https://twitter.com/CubaonSol/",
        contractAddress: "D6MhCCin6UaHGq3fJZgK7NWZH9bmWvmJ3Bgmsp9t7QQZ",
        verified: true, // nationfi
    },
    {
        name: "Mexico",
        twitter: "https://twitter.com/MEXICO_COIN/",
        website: "https://mexicosol.xyz/",
        contractAddress: "Ehk7QXFVqHkyqSpcfmUTCm5mJ9wE5b2axkC6Emcv7Qh1",
        verified: true, // nationfi
    },
    {
        name: "Canada",
        twitter: "https://twitter.com/CanadianonSol/",
        website: "https://canadiancoinonsol.ca/",
        contractAddress: "3zSgyhUqLvDtVnsMnSia6AwxWUE9w3jVMYVV56zzskPG",
        verified: true, // nationfi
    },
    {
        name: "Hungary",
        twitter: "https://twitter.com/HungaryCoin/",
        contractAddress: "4LcE6GDnDg2FuL1BKmLwLRDog3sWRBEj3XegRZPVfeLo",
        verified: false,
    },
    {
        name: "Brazil",
        twitter: "https://twitter.com/BrasilCoinSOL/",
        contractAddress: "HhAcs9JjcveM45FG2Zi3JcWAomra3QezZ22mVvr7zPSE",
        verified: true, // nationfi
    },
    // {
    //     name: "Paraguay",
    //     twitter: "https://twitter.com/paraguayonsol/",
    //     verified: false,
    // },
    {
        name: "Croatia",
        twitter: "https://twitter.com/CroatiaCoin/",
        website: "https://croatiacoin.vip/",
        contractAddress: "EfAeGjyyPSEpsxHHFT7MuhRZTNdm6vqf1zNNAerR7JWG",
        verified: true, // nationfi
    },
    // {
    //     name: "Uruguay",
    //     twitter: "https://twitter.com/URUGUAYONSOL/",
    //     verified: false,
    // },
    // {
    //     name: "Venezuela",
    //     twitter: "https://twitter.com/VenezuelaInSOL/",
    //     verified: false,
    // },
    {
        name: "Israeli",
        twitter: "https://twitter.com/IsraeliCoinSol/",
        contractAddress: "GPJRKb25amJfG1by8WwdMqCT525iZku4fgaFBYAouvin",
        verified: true, // nationfi
    },
    {
        name: "Greece",
        twitter: "https://twitter.com/Greece_Sol/",
        contractAddress: "2JpLKSMREggPDDjyygxQD9rPHQoHnGBPRf5deYDXxKSa",
        verified: false,
    },
    {
        name: "Ireland",
        twitter: "https://twitter.com/IrishCoinSol/",
        contractAddress: "5TdrUp28ngLyDhTU3rUv7qL4oNkGEeVANN7TUPnFHZ9H",
        verified: true, // nationfi
    },
    {
        name: "Germany",
        twitter: "https://twitter.com/GermanyOnSol/",
        website: "https://germanyonsol.com/",
        contractAddress: "52DfsNknorxogkjqecCTT3Vk2pUwZ3eMnsYKVm4z3yWy",
        verified: true, // nationfi
    },
    {
        name: "Romania",
        twitter: "https://twitter.com/RomaniaOnSolana/",
        contractAddress: "AJdBSmueMDKWcL8QXGx4B7kCNft5iVXoUAt2kgwxZ4QN",
        verified: true, // nationfi
    },
    {
        name: "Japan",
        twitter: "https://twitter.com/yensolana/",
        website: "https://japanesecoin.xyz/",
        contractAddress: "2GEwopJhqVu7ZpzpjSQa2E5pSDyGhJADGRcnzWaaD9EG",
        verified: true, // nationfi
    },
    {
        name: "El Salvador",
        twitter: "https://twitter.com/ElsalvadorSol/",
        contractAddress: "5NkV6XmTix99VkifTCDJR4MnmKaCFvfUb9g4u4Lq91Uu",
        verified: true, // nationfi
    },
    {
        name: "Jamaica",
        twitter: "https://twitter.com/jamaica_coin/",
        website: "https://jamcoin.xyz/",
        contractAddress: "8xxFnmiCSK4cVLMvPdcc4CtxvzPRnmtrrTZfXhiGPT4n",
        verified: true, // nationfi
    },
    {
        name: "Luxembourg",
        twitter: "https://twitter.com/Luxonsol/",
        website: "https://www.luxonsol.com/",
        contractAddress: "DKpafe9zPbXgzBLgoPEcH81EJq7WGE9zEQZhe1sSPz4v",
        verified: true, // nationfi
    },
    {
        name: "Poland",
        twitter: "https://twitter.com/polish_coin_sol/",
        contractAddress: "5GGEnfRKKBqGMhq6KtPAMADPAxQnN9FdU5YHPsMarZDT",
        verified: true, // nationfi
    },
    {
        name: "Vietnam",
        twitter: "https://twitter.com/vietnamonsolana/",
        website: "https://vietnamcoin.xyz/",
        contractAddress: "H6nFaW1Y4S2ZPZ3NjfZ39byM85RitpQsx5hvuBoJpHNj",
        verified: true, // nationfi
    },
    {
        name: "Yemen",
        twitter: "https://twitter.com/yemencoin_sol/",
        contractAddress: "3oC1mcKuMLAFp3LcD8r9nEi82YedGafXXKi3fN1Mzbqz",
        verified: true, // nationfi
    },
    {
        name: "Vatican City",
        twitter: "https://twitter.com/VaticancoinSOL/",
        contractAddress: "58cx3cN6UiBPB6kiXXcSaLZGE3Eu9XUJpiZ2XH8SBKtS",
        verified: true, // nationfi
    },
    {
        name: "Nigeria",
        twitter: "https://twitter.com/naijaonsol/",
        website: "https://nigeriaonsol.com/",
        contractAddress: "AHfWYdXqcMVkcqpXjsxDSddfLUcgFEu8bVYzCAX9DhFy",
        verified: true, // nationfi
    },
    {
        name: "Turkey",
        twitter: "https://twitter.com/cointurkiyesol/",
        website: "https://turkiyecoin.site/",
        contractAddress: "Ct2RaUQueSpE2J5y99BwgGu3RkbrdiHSvgPRrr3pMxg2",
        verified: true, // nationfi
    },
    {
        name: "United Kingdom",
        twitter: "https://twitter.com/ukcoinsolana/",
        website: "https://www.ukcoinsolana.com/",
        contractAddress: "2aKb8XmBMthbWNAT5R24Fjw6ENBKEZjNuPFw4hh7Z37W",
        verified: true, // nationfi
    },
    {
        name: "Albania",
        twitter: "https://twitter.com/albaniancoin/",
        website: "https://www.albaniancoin.xyz/",
        contractAddress: "3naigHjGia2cSKpoawyLEYb4xZeG1wQ2yUmtJbCxxJkH",
        verified: true, // nationfi
    },
    {
        name: "Sweden",
        twitter: "https://twitter.com/SwedishCoin/",
        website: "https://swedencoin.lol/",
        contractAddress: "BVAt1aqR6CVCxFseVYhR61WNdg1RXrj2ThPdtanJ45Co",
        verified: true, // nationfi
    },
    {
        name: "Ukraine",
        twitter: "https://twitter.com/ukrainaonsol/",
        website: "https://ukrainecoin.xyz/",
        contractAddress: "6jML6Q2pQD3jPQbsvJmdzRwGta7gWguB4evtgdG9GAtf",
        verified: true, // nationfi
    },
    {
        name: "Switzerland",
        twitter: "https://twitter.com/SwissTokenSol/",
        website: "https://swisstokensol.com/",
        contractAddress: "2A2AzWAw9GEJ9tXoe6gft4jC2RL6LFzbj6DPsbmhjZ2m",
        verified: true, // nationfi
    },
    {
        name: "Portugal",
        twitter: "https://twitter.com/protugalsol/",
        website: "https://protugal.co/",
        contractAddress: "BT2apS5umybEthwy6xP5PfgNDw3ykMyxirY5XxZ7H654",
        verified: true, // nationfi
    },
    {
        name: "Netherlands",
        twitter: "https://twitter.com/NetherlandsSol/",
        website: "https://netherlandsonsol.com/",
        contractAddress: "DH7HuYR54FNp49isrus6AdqREuQfWYV6qaVPg8xVnZQ9",
        verified: true, // nationfi
    },
    {
        name: "Spain",
        twitter: "https://twitter.com/SpainOnSol/",
        website: "https://www.spainonsol.com/",
        contractAddress: "8uz7r3yQq8xnwBfWCoQGAftyYKgUz8wMQWod884nerf4",
        verified: true, // nationfi
    },
    {
        name: "Chad",
        twitter: "https://twitter.com/chad_coin_sol/",
        website: "https://coinofchad.xyz/",
        contractAddress: "2stFro8FfQ8U6mZT2iJxNtgiwvwSfqbVVdCi8RnzoKW5",
        verified: true, // nationfi
    },
    {
        name: "Australia",
        twitter: "https://twitter.com/AustralianCoin_/",
        contractAddress: "8nSQjm6SotxGDGkgBccKchRufynu5KRPBGkBEN4dDk2n",
        verified: true, // nationfi
    },
    {
        name: "South Korea",
        twitter: "https://twitter.com/SOUTHKOREACOIN/",
        website: "https://southkoreacoin.fun/",
        contractAddress: "6tWuipcDv4CiHtXid7JctDbtLLA1VdkTwSDupK6UxzJL",
        verified: true, // nationfi
    },
    {
        name: "Palestine",
        twitter: "https://twitter.com/PalestinCoin/",
        website: "https://palestine-coin.org/",
        contractAddress: "6tSWiRsAZbVnYCHxvnDZ2JSG2QhhkaDdBMNvfPfGbe1n",
        verified: false,
    },
    {
        name: "Saudi Arabia",
        twitter: "https://twitter.com/saudiarabiacoin/",
        website: "https://saudiarabiacoin.net/",
        contractAddress: "Avp2VDgnQqxsnrjtq3ynNhKCfWGEGj1PmGLY5ZmgonjH",
        verified: true, // nationfi
    },
    {
        name: "United Arab Emirates (UAE)",
        twitter: "https://twitter.com/UnitedArabCoin/",
        website: "https://uaesolana.fun/",
        contractAddress: "BSHanq7NmdY6j8u5YE9A3SUygj1bhavFqb73vadspkL3",
        verified: true, // nationfi
    },
    {
        name: "Argentina",
        twitter: "https://twitter.com/ArgentinaOnSol/",
        website: "https://www.argentinacoin.vip/",
        contractAddress: "9XRpjZjhJPeWtUymiEWn3FW7uAnMeQca14ucTWWWyP2g",
        verified: true, // nationfi
    },
    {
        name: "France",
        twitter: "https://twitter.com/franceCoinSol/",
        website: "https://www.francecoin.vip/",
        contractAddress: "F9mv7XXbrXZb1sP2JUoswbCB3WHQM4QGMFDTVfnRZMnP",
        verified: true, // nationfi
    },
    {
        name: "China",
        twitter: "https://twitter.com/ChinaCoinonSol/",
        website: "https://chinanamba1.world/",
        contractAddress: "E2BGnzHdJNUBtAVR7EyQMuEMHqgv65JL8J9ZyqyXUVvA",
        verified: true, // nationfi
    },
    {
        name: "India",
        twitter: "https://twitter.com/IndianCoinOnSol/",
        website: "https://indiancoinsol.com/",
        contractAddress: "Eb6AGbkhow75fgJshgZEpZN1S3P11GdQRXEWX7pvzka3",
        verified: true, // nationfi
    },
    {
        name: "Italy",
        twitter: "https://twitter.com/italiancoin_sol/",
        website: "https://itacoin.io/",
        contractAddress: "GuVoE2qAS3DHaAGSeuZfBkbLjFXfP46DFbogbrVJNHfN",
        verified: true, // nationfi
    },
    {
        name: "USA",
        twitter: "https://twitter.com/USA_ON_CHAIN/",
        website: "https://www.americancoin.xyz/",
        contractAddress: "69kdRLyP5DTRkpHraaSZAQbWmAwzF9guKjZfzMXzcbAs",
        verified: true, // nationfi
    },
    {
        name: "Lebanon",
        twitter: "https://twitter.com/LebanonOnSol/",
        contractAddress: "H78DDnK8YiCFCMzxCrTMdatcun8JZTwYpgFrSHenRvGi",
        verified: false,
    },
];

export const UNITED_NATIONS: Category = {
    name: "United Nations",
    tokens: UNITED_NATIONS_ALL.filter((t) => t.verified === true),
};
