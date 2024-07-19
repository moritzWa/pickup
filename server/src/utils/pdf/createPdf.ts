import {
    success,
    failure,
    UnexpectedError,
    DefaultErrors,
    FailureOrSuccess,
} from "src/core/logic";
import * as handlebars from "handlebars";
import puppeteer, { Browser } from "puppeteer";
import { chunk } from "lodash";

// Creates new pdf from a handlebars tempalate and data
export async function generatePdf(
    template: string,
    data
): Promise<FailureOrSuccess<DefaultErrors, Buffer>> {
    try {
        const result = handlebars.compile(template)(data);

        const browser = await puppeteer.launch({
            headless: true,
            pipe: true,
            args: [
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--single-process",
                "--disable-gpu",
            ],
        });

        const page = await browser.newPage();

        await page.setContent(result, {
            timeout: 0,
            waitUntil: "domcontentloaded",
        });

        await page.emulateMediaType("screen");

        const pdfData = await page.pdf({
            format: "A4",
            timeout: 0,
            printBackground: true,
        });

        await browser.close();

        return success(pdfData);
    } catch (error) {
        return failure(new UnexpectedError(error));
    }
}

export async function generatePdfForRows(
    template: string,
    columns: string[],
    allRows: string[][]
): Promise<FailureOrSuccess<DefaultErrors, Buffer[]>> {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            pipe: true,
            args: [
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--single-process",
                "--disable-gpu",
            ],
        });

        const chunkOfRows = chunk(allRows, 1000);
        const buffers: Buffer[] = [];

        for (const rows of chunkOfRows) {
            const result = handlebars.compile(template)({
                columns,
                rows,
            });

            const page = await browser.newPage();

            await page.setContent(result, {
                timeout: 0,
                waitUntil: "domcontentloaded",
            });

            await page.emulateMediaType("screen");

            const pdfData = await page.pdf({
                format: "A4",
                timeout: 0,
                printBackground: true,
            });

            buffers.push(pdfData);
        }

        await browser.close();

        return success(buffers);
    } catch (error) {
        return failure(new UnexpectedError(error));
    }
}

export const createBrowser = async (): Promise<Browser> => {
    const browser = await puppeteer.launch({
        headless: true,
        pipe: true,
        args: [
            "--disable-dev-shm-usage",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--single-process",
            "--disable-gpu",
        ],
    });

    return browser;
};

export async function generatePdfFromTemplate<DataT>(
    browser: Browser,
    compiledTemplate: HandlebarsTemplateDelegate<DataT>,
    data: DataT
): Promise<FailureOrSuccess<DefaultErrors, Buffer>> {
    try {
        const result = compiledTemplate(data);

        const page = await browser.newPage();

        await page.setContent(result, {
            timeout: 0,
            waitUntil: "domcontentloaded",
        });

        await page.emulateMediaType("screen");

        const pdfData = await page.pdf({
            format: "A4",
            timeout: 0,
            printBackground: true,
        });

        return success(pdfData);
    } catch (error) {
        return failure(new UnexpectedError(error));
    }
}
