import * as Parser from "rss-parser";

const parser = new Parser();

const scrapeRssFeed = async (url: string, name: string) => {
    const feed = await parser.parseURL(url);

    debugger;

    // need to then make all the stuff

    return feed;
};

export const RSSFeedService = {
    scrapeRssFeed,
};
