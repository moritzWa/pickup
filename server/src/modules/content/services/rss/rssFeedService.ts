import * as Parser from "rss-parser";
import { Content } from "src/core/infra/postgres/entities";
import { ContentType } from "src/core/infra/postgres/entities/Content";
import { DefaultErrors, FailureOrSuccess, success } from "src/core/logic";
import { v4 as uuidv4 } from "uuid";

const parser = new Parser();

const scrapeRssFeed = async (
    url: string,
    name: string,
    contentType: ContentType = ContentType.PODCAST,
    _insertionId?: string
): Promise<FailureOrSuccess<DefaultErrors, Content[]>> => {
    let insertionId = _insertionId || uuidv4();

    const feed = await parser.parseURL(url);

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
            authors: [], // TODO:
            releasedAt: item.isoDate ? new Date(item.isoDate) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
            chunks: [],
            type: contentType,
        };

        allContent.push(content);
    }

    // spit off to queue to process

    // need to then make all the stuff

    return success(allContent);
};

export const RSSFeedService = {
    scrapeRssFeed,
};
