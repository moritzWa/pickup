import axios from "axios";
import { dataSource } from "src/core/infra/postgres";
import { Author } from "src/core/infra/postgres/entities/Author/Author";
import { Content } from "src/core/infra/postgres/entities/Content/Content";

interface MatterArticle {
    id: number;
    url: string;
    title: string;
    publication_date: string;
    author_name: string;
}

const scrapeMatterReadSomethingWonderful = async () => {
    await dataSource.initialize();

    const apiUrl = "https://api.getmatter.com/tools/api/rsw_entries/";
    let totalNewContent = 0;
    let totalNewAuthors = 0;
    let totalApiArticles = 0;
    let totalExistingContent = 0;
    let maxId = 0;

    try {
        const response = await axios.get(apiUrl);
        const articles: MatterArticle[] = response.data.results;

        console.log(`API returned ${articles.length} articles`);
        totalApiArticles = articles.length;

        let newContentCount = 0;
        let newAuthorCount = 0;
        let existingContentCount = 0;

        for (const article of articles) {
            const existingContent = await dataSource
                .getRepository(Content)
                .findOne({
                    where: {
                        websiteUrl: article.url,
                    },
                });

            if (existingContent) {
                console.log(`Skipping existing content: ${article.title}`);
                existingContentCount++;
                continue;
            }

            console.log(`New content: ${article.title}`);
            newContentCount++;

            let author: Author | null = null;
            if (article.author_name) {
                author = await dataSource.getRepository(Author).findOne({
                    where: { name: article.author_name },
                });

                if (!author) {
                    author = new Author();
                    author.name = article.author_name;
                    author = await dataSource
                        .getRepository(Author)
                        .save(author);
                    newAuthorCount++;
                    console.log(`New author: ${article.author_name}`);
                }
            }

            const content = new Content();
            content.title = article.title;
            content.websiteUrl = article.url;
            content.followUpQuestions = [];
            content.releasedAt = new Date(article.publication_date);
            content.authors = author ? [author] : [];

            // Save the content entity
            await dataSource.getRepository(Content).save(content);

            // Update the author with the new content
            if (author) {
                author.contents = author.contents || [];
                author.contents.push(content);
                await dataSource.getRepository(Author).save(author);
            }
        }

        console.log(`Batch results:`);
        console.log(`New content added: ${newContentCount}`);
        console.log(`New authors added: ${newAuthorCount}`);
        console.log(`Existing content skipped: ${existingContentCount}`);

        totalNewContent = newContentCount;
        totalNewAuthors = newAuthorCount;
        totalExistingContent = existingContentCount;
    } catch (error) {
        console.error(`Error during scraping:`, error);
    }

    console.log("Scraping completed:");
    console.log(`Total articles from API: ${totalApiArticles}`);
    console.log(`Total new content added: ${totalNewContent}`);
    console.log(`Total new authors added: ${totalNewAuthors}`);
    console.log(`Total existing content skipped: ${totalExistingContent}`);

    await dataSource.destroy();
};

scrapeMatterReadSomethingWonderful().catch(console.error);
