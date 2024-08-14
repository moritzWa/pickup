import puppeteer from "puppeteer";

const scrapeSomethingWonderful = async () => {
    const url = "https://www.readsomethinggreat.com";
    const distinctArticles = new Set<string>();

    const browser = await puppeteer.launch({ headless: false }); // Set headless to false
    const page = await browser.newPage();

    for (let i = 0; i < 2; i++) {
        try {
            console.log(`Fetching URL: ${url}`);
            await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }); // Added timeout

            // Wait for the articles to load
            await page.waitForSelector(".bubble-element.Group");

            const articles = await page.evaluate(() => {
                const articleElements = document.querySelectorAll(
                    ".bubble-element.Group[id^='GroupArticle']"
                );
                const articles: {
                    category: string;
                    title: string;
                    authorAndDuration: string;
                    excerpt: string;
                    url: string;
                }[] = [];

                articleElements.forEach((element) => {
                    const category = element
                        .querySelector(
                            ".bubble-element.Group > .bubble-element.Group > .bubble-element.Group > .bubble-element.Text"
                        )
                        ?.textContent?.trim();
                    const title = element
                        .querySelector(
                            ".bubble-element.Group > .bubble-element.Group > .bubble-element.Group > .bubble-element.Group > .bubble-element.Text:nth-child(1)"
                        )
                        ?.textContent?.trim();
                    const authorAndDuration = element
                        .querySelector(
                            ".bubble-element.Group > .bubble-element.Group > .bubble-element.Group > .bubble-element.Group > .bubble-element.Text:nth-child(2)"
                        )
                        ?.textContent?.trim();
                    const excerpt = element
                        .querySelector(
                            ".bubble-element.Group > .bubble-element.Group > .bubble-element.Group > .bubble-element.Group > .bubble-element.Text:nth-child(3)"
                        )
                        ?.textContent?.trim();
                    const readNowLink = element.querySelector(
                        "a.bubble-element.Link[href]:not([title='share article'])"
                    );
                    const url = readNowLink?.getAttribute("href");

                    if (
                        category &&
                        title &&
                        authorAndDuration &&
                        excerpt &&
                        url
                    ) {
                        articles.push({
                            category,
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
