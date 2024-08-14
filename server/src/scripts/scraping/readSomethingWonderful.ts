import puppeteer from "puppeteer";
import { dataSource } from "src/core/infra/postgres";
import { Author } from "src/core/infra/postgres/entities/Author/Author";
import { Content } from "src/core/infra/postgres/entities/Content/Content";

const scrapeSomethingWonderful = async () => {
    await dataSource.initialize();

    const url = "https://www.readsomethinggreat.com";
    const distinctArticles = new Set<string>();

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Add this line to capture console logs from the browser
    page.on("console", (msg) => console.log("Browser Log:", msg.text()));

    for (let i = 0; i < 20; i++) {
        try {
            console.log(`Fetching URL: ${url}`);
            await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }); // Added timeout

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

            console.log("Debug Info:", JSON.stringify(debugInfo, null, 2));

            for (const article of articles) {
                if (
                    article.title.includes(
                        "AudioPen: Go from fuzzy thought to clear text"
                    )
                ) {
                    console.log("Skipping AudioPen advertisement");
                    continue;
                }

                distinctArticles.add(JSON.stringify(article));

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

                // Save the content first
                const savedContent = await dataSource
                    .getRepository(Content)
                    .save(content);

                // Update the authors with the new content
                for (const author of authors) {
                    if (!author.contents) {
                        author.contents = [];
                    }
                    author.contents.push(savedContent);
                    await dataSource.getRepository(Author).save(author);
                }

                // Update the content with the authors
                savedContent.authors = authors;
                await dataSource.getRepository(Content).save(savedContent);
            }
        } catch (error) {
            console.error(`Error during fetch: ${error}`);
        }
    }

    await browser.close();

    console.log(`Found ${distinctArticles.size} distinct articles.`);
    distinctArticles.forEach((article) => console.log(JSON.parse(article)));

    // // Add this verification step
    // try {
    //     const contentRepository = dataSource.getRepository(Content);
    //     const sampleContent = await contentRepository.findOneOrFail({
    //         where: {},
    //         relations: ["authors"],
    //         order: { id: "DESC" },
    //     });

    //     console.log("Verification: Sample Content");
    //     console.log("Title:", sampleContent.title);
    //     console.log("Authors:");
    //     if (sampleContent.authors && sampleContent.authors.length > 0) {
    //         sampleContent.authors.forEach((author) => {
    //             console.log(`- ${author.name}`);
    //         });
    //     } else {
    //         console.log("No authors found for this content.");
    //     }
    // } catch (error) {
    //     if (error instanceof Error) {
    //         console.error("Error during verification:", error.message);
    //     } else {
    //         console.error("Error during verification:", error);
    //     }
    // }

    await dataSource.destroy();
};

scrapeSomethingWonderful().catch(console.error);
