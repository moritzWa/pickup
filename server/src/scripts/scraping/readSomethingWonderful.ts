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
                        // category: {
                        //     text: category,
                        //     html: removeStyles(
                        //         element.querySelector(
                        //             ".bubble-element.Text:first-child"
                        //         )?.outerHTML || ""
                        //     ),
                        // },
                        title: {
                            selector:
                                ".bubble-element.Group[id^='GroupArticle'] > .bubble-element.Group.cmaUaZh > .bubble-element.Text:nth-of-type(1)", // Updated selector to target the title correctly
                            found: !!titleElement,
                            text: title,
                            html: removeStyles(titleElement?.outerHTML || ""),
                        },
                        // authorAndDuration: {
                        //     text: authorAndDuration,
                        //     html: removeStyles(authorElement?.outerHTML || ""),
                        // },
                        // excerpt: {
                        //     text: excerpt,
                        //     html: removeStyles(excerptElement?.outerHTML || ""),
                        // },
                        // fullHtml: removeStyles(element.outerHTML),
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
