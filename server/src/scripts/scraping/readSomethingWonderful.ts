import puppeteer from "puppeteer";

const scrapeSomethingWonderful = async () => {
    const url = "https://www.readsomethinggreat.com";
    const distinctArticles = new Set<string>();

    const browser = await puppeteer.launch({ headless: false }); // Set headless to false
    const page = await browser.newPage();

    for (let i = 0; i < 10; i++) {
        try {
            console.log(`Fetching URL: ${url}`);
            await page.goto(url, { waitUntil: "networkidle2" });

            // Wait for the articles to load
            await page.waitForSelector(".bubble-element.Group");

            const articles = await page.evaluate(() => {
                const articleElements = document.querySelectorAll(
                    ".bubble-element.Group"
                );
                const articles: {
                    title: string;
                    authorAndDuration: string;
                    excerpt: string;
                    url: string;
                }[] = [];

                articleElements.forEach((element) => {
                    const title = element
                        .querySelector(".Text:nth-of-type(1)")
                        ?.textContent?.trim();
                    const authorAndDuration = element
                        .querySelector(".Text:nth-of-type(2)")
                        ?.textContent?.trim();
                    const excerpt = element
                        .querySelector(".Text:nth-of-type(3)")
                        ?.textContent?.trim();
                    const url = element
                        .querySelector("a:contains('Read Now')")
                        ?.getAttribute("href");

                    if (title && authorAndDuration && excerpt && url) {
                        articles.push({
                            title,
                            authorAndDuration,
                            excerpt,
                            url,
                        });
                    }
                });

                return articles;
            });

            articles.forEach((article) => {
                distinctArticles.add(JSON.stringify(article));
            });
        } catch (error) {
            console.error(`Error during fetch: ${error}`);
        }
    }

    await browser.close();

    console.log(`Found ${distinctArticles.size} distinct articles.`);
    distinctArticles.forEach((article) => console.log(JSON.parse(article)));
};

scrapeSomethingWonderful().catch(console.error);
