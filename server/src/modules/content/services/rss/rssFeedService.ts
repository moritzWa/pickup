import * as Parser from "rss-parser";
import { Content } from "src/core/infra/postgres/entities";
import { v4 as uuidv4 } from "uuid";

const parser = new Parser();

const scrapeRssFeed = async (
    url: string,
    name: string,
    _insertionId?: string
) => {
    let insertionId = _insertionId || uuidv4();

    const feed = await parser.parseURL(url);

    debugger;

    const items = feed.items;
    const websiteUrl = feed.link;
    const allContent: Content[] = [];

    for (const item of items) {
        const categories = [];

        const content: Content = {
            id: uuidv4(),
            isProcessed: false,
            content: item.content || "",
            context: item.content || "",
            insertionId,
            sourceImageUrl: "",
            audioUrl: item.enclosure?.url || "",
            lengthMs: 0, // TODO: this needs to be processed async
            embedding: null, // TODO:
            categories,
            thumbnailImageUrl: "",
            referenceId: item.guid || uuidv4(),
            title: item.title || "",
            summary: item.contentSnippet || "",
            followUpQuestions: [],
            websiteUrl: websiteUrl || "",
            releasedAt: item.isoDate ? new Date(item.isoDate) : null,
            authorImageUrl: feed.image?.link || "",
            authorName: feed.title || "",
            createdAt: new Date(),
            updatedAt: new Date(),
            chunks: [],
        };

        allContent.push(content);
    }

    debugger;

    // spit off to queue to process

    // need to then make all the stuff

    return feed;
};

export const RSSFeedService = {
    scrapeRssFeed,
};
