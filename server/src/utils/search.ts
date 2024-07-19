export const parseTicker = (search: string) => {
    return search.replace(/\$/g, "").toLowerCase().trim();
};

export const repairTicker = (
    strippedTicker: string,
    wifDollarSign: boolean = false
) => {
    if (strippedTicker.toLowerCase() === "wif") return "$WIF";
    return `${wifDollarSign ? "$" : ""}${strippedTicker.toUpperCase()}`;
};
