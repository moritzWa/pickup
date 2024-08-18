import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { NodeHtmlMarkdown } from "node-html-markdown";
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
import { v4 as uuidv4 } from "uuid";
import { contentRepo } from "../infra";

export const ContentFromUrlService = {
    createFromUrl: async (
        url: string
    ): Promise<FailureOrSuccess<DefaultErrors, Content>> => {
        try {
            // Fetch and parse content
            const parsedContent = await fetchAndParseContent(url);

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
                couldntFetchThumbnail: false,
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

    const content: Partial<Content> = {
        type: ContentType.ARTICLE,
        content: article.textContent,
        contentAsMarkdown: NodeHtmlMarkdown.translate(article.content),
        title: article.title,
        websiteUrl: url,
        // ogDescription: article.excerpt, get this from findThumbnailUrl
        thumbnailImageUrl: findThumbnailUrl(window.document),
        categories: [],
        followUpQuestions: [],
        authors: [],
        length: article.length,
        excerpt: article.excerpt,
        releasedAt: null,
    };

    return content;
}

function findThumbnailUrl(document: Document): string | null {
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.getAttribute("content")) {
        return ogImage.getAttribute("content");
    }

    const firstImage = document.querySelector("img");
    if (firstImage && firstImage.getAttribute("src")) {
        return firstImage.getAttribute("src");
    }

    return null;
}
