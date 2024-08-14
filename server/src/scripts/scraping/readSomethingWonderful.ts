import puppeteer from "puppeteer";

const scrapeSomethingWonderful = async () => {
    const url = "https://www.readsomethinggreat.com";
    const distinctArticles = new Set<string>();

    const browser = await puppeteer.launch({ headless: false }); // Set headless to false
    const page = await browser.newPage();

    // Add this line to capture console logs from the browser
    page.on("console", (msg) => console.log("Browser Log:", msg.text()));

    for (let i = 0; i < 2; i++) {
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

                articleElements.forEach((element, index) => {
                    const category = element
                        .querySelector(".bubble-element.Text:first-child")
                        ?.textContent?.trim();

                    const titleElement = element.querySelector(
                        ".bubble-element.Group > .bubble-element.Group > .bubble-element.Text:first-of-type"
                    );

                    const title = titleElement?.textContent?.trim();

                    // Debug information for title
                    debugInfo[`article_${index}_title`] = {
                        selector:
                            ".bubble-element.Group > .bubble-element.Group > .bubble-element.Text:first-of-type",
                        found: !!titleElement,
                        text: title,
                        html: titleElement?.outerHTML,
                    };

                    const authorAndDuration = element
                        .querySelector(
                            ".bubble-element.Group > .bubble-element.Group > .bubble-element.Text:nth-of-type(2)"
                        )
                        ?.textContent?.trim();

                    const author = authorAndDuration?.split("|")[0]?.trim();
                    const duration = authorAndDuration?.split("|")[1]?.trim();

                    const excerpt = element
                        .querySelector(
                            ".bubble-element.Group > .bubble-element.Group > .bubble-element.Text:nth-of-type(3)"
                        )
                        ?.textContent?.trim();
                    const readNowLink = element.querySelector(
                        "a.bubble-element.Link[href]:not([title='share article'])"
                    );
                    const url = readNowLink?.getAttribute("href");

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
