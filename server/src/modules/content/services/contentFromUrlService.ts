import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { Content } from "src/core/infra/postgres/entities";
import { ContentType } from "src/core/infra/postgres/entities/Content";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    isSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";
import { AudioService } from "src/shared/audioService";
import { firebase, Logger } from "src/utils";
import { v4 as uuidv4 } from "uuid";
import { contentRepo } from "../infra";
import { OpenGraphService } from "./openGraphService";

export const ContentFromUrlService = {
    createFromUrl: async (
        url: string
    ): Promise<FailureOrSuccess<DefaultErrors, Content>> => {
        try {
            // Fetch and parse content
            const parsedContent = await fetchAndParseContent(url);

            Logger.info(
                `Parsed content: ${JSON.stringify(
                    parsedContent
                )} now generating audio`
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
                thumbnailImageUrl: parsedContent.thumbnailImageUrl || null,
                audioUrl: audioResponse.value.url,
                lengthMs: null,
                title: parsedContent.title || "",
                summary: null,
                ogDescription: parsedContent.ogDescription || null,
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
                couldntFetchThumbnail: parsedContent.couldntFetchThumbnail,
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

async function fetchAndParseContent(url: string): Promise<Partial<Content>> {
    const response = await fetch(url);
    const html = await response.text();
    const { window } = new JSDOM(html);
    const reader = new Readability(window.document);
    const article = reader.parse();

    if (!article) {
        throw new Error("Failed to parse article");
    }

    const openGraphData = await OpenGraphService.fetchOpenGraphData(url);

    const content: Partial<Content> = {
        type: ContentType.ARTICLE,
        content: article.textContent,
        contentAsMarkdown: NodeHtmlMarkdown.translate(article.content),
        title: article.title,
        websiteUrl: url,
        thumbnailImageUrl: openGraphData.thumbnailImageUrl,
        ogDescription: openGraphData.ogDescription,
        categories: [],
        followUpQuestions: [],
        authors: [],
        length: article.length,
        excerpt: article.excerpt,
        releasedAt: null,
        couldntFetchThumbnail: openGraphData.couldntFetchThumbnail,
    };

    return content;
}
