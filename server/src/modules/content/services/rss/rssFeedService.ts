import * as Parser from "rss-parser";
import { Content } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
} from "src/core/logic";
import { authorRepo } from "src/modules/author/infra";
import { AuthorService } from "src/modules/author/services/authorService";
import { v4 as uuidv4 } from "uuid";

const parser = new Parser();

const scrapeRssFeed = async (
    url: string,
    name: string,
    _insertionId?: string
): Promise<FailureOrSuccess<DefaultErrors, Content[]>> => {
    let insertionId = _insertionId || uuidv4();

    const feed = await parser.parseURL(url);

    const authorResponse = await AuthorService.findOrCreate(name, {
        imageUrl: feed.image?.url || "",
    });

    if (authorResponse.isFailure()) {
        return failure(authorResponse.error);
    }

    const author = authorResponse.value;
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
            sourceImageUrl: feed.image?.url || "",
            audioUrl: item.enclosure?.url || "",
            lengthMs: item.enclosure?.length
                ? parseInt(item.enclosure.length.toString())
                : 0,
            embedding: null, // done later
            categories,
            thumbnailImageUrl: item.itunes?.image || feed.image?.url || "",
            referenceId: item.guid || uuidv4(),
            title: item.title || "",
            summary: item.contentSnippet || "",
            followUpQuestions: [],
            websiteUrl: websiteUrl || "",
            authors: [author],
            releasedAt: item.isoDate ? new Date(item.isoDate) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
            chunks: [],
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
