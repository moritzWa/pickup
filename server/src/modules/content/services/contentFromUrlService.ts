import { Content } from "src/core/infra/postgres/entities";
import { ContentType } from "src/core/infra/postgres/entities/Content";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";
import { Logger } from "src/utils";
import { v4 as uuidv4 } from "uuid";
import { contentRepo } from "../infra";
import { AudioGenerationQueue } from "./audioGenerationQueue";
import { OpenGraphService } from "./openGraphService";
import { ScrapeContentTextService } from "./scrapeContentTextService";

const truncateText = (text: string, maxLength: number = 100): string => {
    if (text && text.length > maxLength) {
        return (
            text.slice(0, maxLength) +
            `... (truncated ${text.length - maxLength} chars)`
        );
    }
    return text || "";
};

export const ContentFromUrlService = {
    createFromUrl: async (
        url: string
    ): Promise<FailureOrSuccess<DefaultErrors, Content>> => {
        try {
            // Only turn this of if scraping content from json like response where author is already extracted/created
            const createAuthorIfBylineFound = true;

            // Fetch and parse content
            const parsedContent = await ScrapeContentTextService.processContent(
                {
                    websiteUrl: url,
                    title: "",
                    // Add other necessary fields with default values
                } as Content,
                createAuthorIfBylineFound
            );

            Logger.info(
                `contentFromUrlService.createFromUrl Parsed content: ${JSON.stringify(
                    {
                        ...parsedContent,
                        content: truncateText(parsedContent.content || ""),
                        contentAsMarkdown: truncateText(
                            parsedContent.contentAsMarkdown || ""
                        ),
                    }
                )} now generating audio`
            );

            // Fetch OpenGraph data
            const openGraphData = await OpenGraphService.fetchOpenGraphData(
                url
            );

            const content: Content = {
                id: uuidv4(),
                type: ContentType.ARTICLE,
                content: parsedContent.content || null,
                contentAsMarkdown: parsedContent.contentAsMarkdown || null,
                insertionId: null,
                isProcessed: false,
                thumbnailImageUrl: openGraphData.thumbnailImageUrl || null,
                audioUrl: null, // Initially null
                lengthMs: null, // Initially null
                title: parsedContent.title || "",
                summary: null,
                ogDescription: openGraphData.ogDescription || null,
                websiteUrl: url,
                categories: parsedContent.categories || [],
                authors: parsedContent.authors || [],
                followUpQuestions: [],
                referenceId: null,
                chunks: [],
                releasedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                excerpt: parsedContent.excerpt,
                length: parsedContent.length,
                skippedNotProbablyReadable: false,
                skippedInaccessiblePDF: false,
                skippedErrorFetchingFullText: false,
                deadLink: false,
                couldntFetchThumbnail: openGraphData.couldntFetchThumbnail,
                sourceImageUrl: parsedContent.thumbnailImageUrl || null,
            };

            // Save content to the database
            const savedContentResponse = await contentRepo.save(content);
            if (savedContentResponse.isFailure()) {
                return failure(savedContentResponse.error);
            }

            const createAudioContent = true;
            // process.env.NODE_ENV === "production" ? true : false;
            if (createAudioContent) {
                // Enqueue audio generation task
                await AudioGenerationQueue.add("generateAudio", {
                    contentId: content.id,
                    text: parsedContent.content || "",
                    title: parsedContent.title || "",
                });
            } else {
                Logger.info(
                    `Audio generation disabled in contentFromUrlService.ts because process.env.NODE_ENV is not production: ${content.title}`
                );
            }

            return success(savedContentResponse.value);
        } catch (error) {
            return failure(new UnexpectedError(error));
        }
    },
};
