import * as Parser from "rss-parser";

const parser = new Parser();

const testRss = "https://feeds.megaphone.fm/HS2300184645";

const parseRssFeed = async (url: string) => {
    const feed = await parser.parseURL(url);

    debugger;

    return feed;
};

// if this file, call parse rss feed

if (require.main === module) {
    void parseRssFeed(testRss);
}
