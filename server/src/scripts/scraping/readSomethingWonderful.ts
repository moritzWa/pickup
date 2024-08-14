import puppeteer from "puppeteer";
import { dataSource } from "src/core/infra/postgres";
import { Author } from "src/core/infra/postgres/entities/Author/Author";
import { Content } from "src/core/infra/postgres/entities/Content/Content";

const scrapeSomethingWonderful = async () => {
    await dataSource.initialize();

    const url = "https://www.readsomethinggreat.com";
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    page.on("console", (msg) => console.log("Browser Log:", msg.text()));

    let batchNumber = 1;
    let totalNewContent = 0;
    let totalNewAuthors = 0;
    let consecutiveEmptyBatches = 0;

    while (consecutiveEmptyBatches < 3) {
        console.log(`Starting batch ${batchNumber}`);
        try {
            await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
            await page.waitForSelector(".bubble-element.Group");

            const { articles, debugInfo } = await page.evaluate(() => {
                const articleElements = document.querySelectorAll(
                    ".bubble-element.Group[id^='GroupArticle']"
                );
                const articles: {
                    category: string;
                    title: string;
                    author: string;
                    duration: string;
                    excerpt: string;
                    url: string;
                }[] = [];

                const debugInfo: any = {};

                function removeStyles(html: string): string {
                    return html.replace(/\s*style="[^"]*"/g, "");
                }

                articleElements.forEach((element, index) => {
                    const category = element
                        .querySelector(".bubble-element.Text:first-child")
                        ?.textContent?.trim();

                    const titleElement = element.querySelector(
                        ".bubble-element.Group > div:nth-of-type(3) > div:nth-of-type(1)"
                    );

                    const title = titleElement?.textContent?.trim();

                    const authorElement = element.querySelector(
                        ".bubble-element.Group > .bubble-element.Group > .bubble-element.Text:nth-of-type(2)"
                    );

                    const authorAndDuration =
                        authorElement?.textContent?.trim();
                    const author = authorAndDuration?.split("|")[0]?.trim();
                    const duration = authorAndDuration?.split("|")[1]?.trim();

                    const excerptElement = element.querySelector(
                        ".bubble-element.Group > .bubble-element.Group > .bubble-element.Text:nth-of-type(3)"
                    );

                    const excerpt = excerptElement?.textContent?.trim();

                    const readNowLink = element.querySelector(
                        "a.bubble-element.Link[href]:not([title='share article'])"
                    );
                    const url = readNowLink?.getAttribute("href");

                    // Debug information
                    debugInfo[`article_${index}`] = {
                        title: {
                            selector:
                                ".bubble-element.Group[id^='GroupArticle'] > .bubble-element.Group.cmaUaZh > .bubble-element.Text:nth-of-type(1)", // Updated selector to target the title correctly
                            found: !!titleElement,
                            text: title,
                            html: removeStyles(titleElement?.outerHTML || ""),
                        },
                    };

                    if (
                        category &&
                        title &&
                        author &&
                        duration &&
                        excerpt &&
                        url
                    ) {
                        articles.push({
                            category,
                            title,
                            author,
                            duration,
                            excerpt,
                            url,
                        });
                    }
                });

                return { articles, debugInfo };
            });

            // console.log("Debug Info:", JSON.stringify(debugInfo, null, 2));

            let newContentCount = 0;
            let newAuthorCount = 0;

            for (const article of articles) {
                if (
                    article.title.includes(
                        "AudioPen: Go from fuzzy thought to clear text"
                    )
                ) {
                    console.log("Skipping AudioPen advertisement");
                    continue;
                }

                const existingContent = await dataSource
                    .getRepository(Content)
                    .findOne({
                        where: {
                            title: article.title,
                            websiteUrl: article.url,
                        },
                    });

                if (existingContent) {
                    console.log(`Skipping existing content: ${article.title}`);
                    continue;
                }

                newContentCount++;

                const authorNames = article.author
                    .split("&")
                    .map((name) => name.trim());
                const authors: Author[] = [];

                for (const name of authorNames) {
                    let author = await dataSource
                        .getRepository(Author)
                        .findOne({
                            where: { name },
                        });

                    if (!author) {
                        author = new Author();
                        author.name = name;
                        author = await dataSource
                            .getRepository(Author)
                            .save(author);
                        newAuthorCount++;
                    }

                    authors.push(author);
                }

                const durationInMinutes = parseInt(
                    article.duration.split(" ")[0]
                );
                const durationInMs = durationInMinutes * 60 * 1000;

                const content = new Content();
                content.title = article.title;
                content.summary = article.excerpt;
                content.categories = [article.category];
                content.lengthMs = durationInMs;
                content.websiteUrl = article.url;
                content.followUpQuestions = [];
                content.authors = authors;

                // Save the content entity
                await dataSource.getRepository(Content).save(content);

                // Update the authors with the new content
                for (const author of authors) {
                    author.contents = author.contents || [];
                    author.contents.push(content);
                    await dataSource.getRepository(Author).save(author);
                }
            }

            console.log(`Batch ${batchNumber} results:`);
            console.log(`New content added: ${newContentCount}`);
            console.log(`New authors added: ${newAuthorCount}`);

            totalNewContent += newContentCount;
            totalNewAuthors += newAuthorCount;

            if (newContentCount === 0) {
                consecutiveEmptyBatches++;
            } else {
                consecutiveEmptyBatches = 0;
            }

            batchNumber++;
        } catch (error) {
            console.error(`Error during batch ${batchNumber}:`, error);
        }

        // Wait for 5 seconds before the next batch
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    await browser.close();

    console.log("Scraping completed:");
    console.log(`Total new content added: ${totalNewContent}`);
    console.log(`Total new authors added: ${totalNewAuthors}`);

    await dataSource.destroy();
};

scrapeSomethingWonderful().catch(console.error);
