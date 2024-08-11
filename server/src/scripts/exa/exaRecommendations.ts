import { Logger } from "src/utils/logger";

// fetch posts that user liked/listened to
const likedPosts = [
    {
        title: "The Concept That Explains Everything About Marketplaces",
        subtitle:
            "Understanding transaction costs will help you understand where marketplaces will succeed, what kind of marketplaces to build, and how to price them.",
        author: "Dan Hockenmaier",
        url: "https://www.danhock.co/p/transaction-costs",
    },
    {
        title: "Eight Billion Reasons to Celebrate",
        subtitle: "Why a larger population is a radically good thing.",
        author: "Tom Hyde",
        url: "https://tomhyde.substack.com/p/eight-billion-reasons-to-celebrate",
    },
    {
        title: "The Five Types of Wealth",
        subtitle: "and why people chase only one at the cost of others.",
        author: "Atman",
        url: "https://www.theknowledgetoolkit.com/p/the-five-types-of-wealth",
    },
    {
        title: "Lessons from Peter Thiel",
        author: "Joe Lonsdale",
        url: "https://joelonsdale.substack.com/p/lessons-from-peter-thiel",
    },
];

// fetch user preferences
const userPreferences = [
    "epistemology",
    "economics",
    "company building",
    "consumer network effects",
    "podcast industry",
    "LLMS in 2025",
];

const buildExaPrompt = (
    likedPosts: any[],
    userPreferences: string[]
): string => {
    const likedPostsList = likedPosts
        .map((post) => {
            let postString = `"${post.title}"`;
            if (post.subtitle) {
                postString += ` (${post.subtitle})`;
            }
            if (post.author) {
                postString += ` by ${post.author}`;
            }
            return postString;
        })
        .join(", ");

    const preferencesList = userPreferences.join(", ");

    return `It seems you liked these posts: ${likedPostsList}. And you said you are currently interested in: ${preferencesList}. You would enjoy this essay:`;
};

import Exa from "exa-js";

const exa = new Exa("f760bd4b-f5c4-48c4-81cf-ae66d927e4cd");

const truncateText = (text: string, maxLength: number = 100): string => {
    if (text && text.length > maxLength) {
        return text.slice(0, maxLength) + "...";
    }
    return text || "";
};

const exaRecommendationsWithPrompt = async () => {
    const prompt = buildExaPrompt(likedPosts, userPreferences);
    Logger.info(`Generated prompt: ${prompt}`);

    try {
        const result = await exa.searchAndContents(prompt, {
            type: "auto",
            numResults: 5,
            text: true,
        });

        const truncatedResults = result.results.map((article) => ({
            ...article,
            text: truncateText(article.text),
        }));

        Logger.info(
            `Recommendations based on prompt: ${JSON.stringify(
                truncatedResults,
                null,
                2
            )}`
        );
    } catch (error) {
        Logger.error(`Error fetching recommendations: ${error}`);
    }
};

const exaRecommendationsWithLinkSimilarity = async () => {
    const excludedDomains = [
        "twitter.com",
        "facebook.com",
        "instagram.com",
        "linkedin.com",
        "youtube.com",
        "reddit.com",
        "pinterest.com",
        "tiktok.com",
        "github.com",
        "medium.com",
        "news.ycombinator.com",
    ];

    try {
        const similarArticles = await Promise.all(
            likedPosts.map(async (post) => {
                const result = await exa.findSimilarAndContents(post.url, {
                    numResults: 3,
                    text: true,
                    excludeDomains: [...excludedDomains],
                    startPublishedDate: "2023-01-01T00:00:00.000Z",
                    endPublishedDate: new Date().toISOString(),
                });

                const truncatedResults = result.results.map((article) => ({
                    ...article,
                    text: truncateText(article.text),
                }));

                return {
                    originalPost: {
                        title: post.title,
                        subtitle: post.subtitle,
                        author: post.author,
                        url: post.url,
                    },
                    similarArticles: {
                        results: truncatedResults,
                    },
                };
            })
        );

        Logger.info(
            `Recommendations based on link similarity: ${JSON.stringify(
                similarArticles,
                null,
                2
            )}`
        );
    } catch (error) {
        Logger.error(`Error fetching similar articles: ${error}`);
    }
};

const runExaRecommendations = async () => {
    await exaRecommendationsWithPrompt();
    await exaRecommendationsWithLinkSimilarity();
};

runExaRecommendations().catch((error) =>
    Logger.error(`Error running Exa recommendations: ${error}`)
);
