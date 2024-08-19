import { Content } from "src/core/infra/postgres/entities";
import { ContentType } from "src/core/infra/postgres/entities/Content";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";
import { AudioService } from "src/shared/audioService";
import { Logger } from "src/utils";
import { v4 as uuidv4 } from "uuid";
import { contentRepo } from "../infra";
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
            // Fetch and parse content
            const parsedContent = await ScrapeContentTextService.processContent(
                {
                    websiteUrl: url,
                    title: "",
                    // Add other necessary fields with default values
                } as Content
            );

            Logger.info(
                `Parsed content: ${JSON.stringify({
                    ...parsedContent,
                    content: truncateText(parsedContent.content || ""),
                    contentAsMarkdown: truncateText(
                        parsedContent.contentAsMarkdown || ""
                    ),
                })} now generating audio`
            );

            // Fetch OpenGraph data
            const openGraphData = await OpenGraphService.fetchOpenGraphData(
                url
            );

            // Generate audio
            const audioResponse = await AudioService.generate(
                parsedContent.content || "",
                parsedContent.title || ""
            );
            if (audioResponse.isFailure()) {
                return failure(audioResponse.error);
            }

            const content: Content = {
                id: uuidv4(),
                type: ContentType.ARTICLE,
                content: parsedContent.content || null,
                contentAsMarkdown: parsedContent.contentAsMarkdown || null,
                insertionId: null,
                isProcessed: false,
                thumbnailImageUrl: openGraphData.thumbnailImageUrl || null,
                audioUrl: audioResponse.value.url,
                lengthMs: null,
                title: parsedContent.title || "",
                summary: null,
                ogDescription: openGraphData.ogDescription || null,
                websiteUrl: url,
                categories: parsedContent.categories || [],
                authors: [],
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

            // Save content
            const savedContentResponse = await contentRepo.save(content);
            if (savedContentResponse.isFailure()) {
                return failure(savedContentResponse.error);
            }

            return success(savedContentResponse.value);
        } catch (error) {
            return failure(new UnexpectedError(error));
        }
    },
};
