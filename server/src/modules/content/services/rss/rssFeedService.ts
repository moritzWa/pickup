import * as Parser from "rss-parser";
import { Content } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";
import { authorRepo } from "src/modules/author/infra";
import { AuthorService } from "src/modules/author/services/authorService";
import { ContentType } from "src/core/infra/postgres/entities/Content";
import { v4 as uuidv4 } from "uuid";
import { contentRepo } from "../../infra";
import { In } from "typeorm";
import { keyBy } from "lodash";
import { fork } from "radash";
import { inngest } from "src/jobs/inngest/clients";
import { InngestEventName } from "src/jobs/inngest/types";

const parser = new Parser();

const scrapeRssFeed = async (
    url: string,
    name: string,
    contentType: ContentType = ContentType.PODCAST,
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
            contentAsMarkdown: null,
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
            type: contentType,
        };

        allContent.push(content);
    }

    // spit off to queue to process

    // need to then make all the stuff

    return success(allContent);
};

const upsertRssFeed = async (
    content: Content[]
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        { added: number; upserted: number; addedContent: Content[] }
    >
> => {
    try {
        const referenceIds = content.map((c) => c.referenceId);

        const referencedContentResponse = await contentRepo.find({
            where: {
                referenceId: In(referenceIds),
            },
        });

        const referencedContentByRefId = keyBy<Content>(
            referencedContentResponse.value,
            (c: Content) => c.referenceId || uuidv4()
        );

        const [contentToAdd, contentToUpdate] = fork(
            content,
            (c) => !referencedContentByRefId[c.referenceId || ""]
        );

        // backfill content already added
        await Promise.all(
            contentToUpdate.map(async (c) => {
                const refContent =
                    referencedContentByRefId[c.referenceId || ""]!;

                if (refContent) {
                    // update that content with the fields
                    const newContent = { ...refContent };

                    newContent.id = refContent.id;

                    newContent.thumbnailImageUrl =
                        c.thumbnailImageUrl || newContent.thumbnailImageUrl;

                    newContent.authors = c.authors || newContent.authors;

                    newContent.sourceImageUrl =
                        c.sourceImageUrl || newContent.sourceImageUrl;

                    newContent.referenceId =
                        c.referenceId || newContent.referenceId;

                    const response = await contentRepo.save(newContent);

                    if (response.isFailure()) {
                        return failure(response.error);
                    }
                }
            })
        );

        const response = await contentRepo.bulkInsert(contentToAdd);

        if (response.isFailure()) {
            return failure(response.error);
        }

        console.log(`[inserted ${contentToAdd.length} content]`);

        for (const addedContent of contentToAdd) {
            await inngest.send({
                name: InngestEventName.ProcessContent,
                data: { contentId: addedContent.id },
            });
        }

        return success({
            addedContent: contentToAdd,
            added: contentToAdd.length,
            upserted: contentToUpdate.length,
        });
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const RSSFeedService = {
    scrapeRssFeed,
    upsertRssFeed,
};
