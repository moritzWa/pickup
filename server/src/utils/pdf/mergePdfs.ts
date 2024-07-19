import { PDFDocument } from "pdf-lib";
import {
    UnexpectedError,
    failure,
    success,
    FailureOrSuccess,
    DefaultErrors,
} from "src/core/logic";

export async function mergePdfs(
    ...pdfs: ArrayBuffer[]
): Promise<FailureOrSuccess<DefaultErrors, ArrayBuffer>> {
    try {
        const mergedPdf = await PDFDocument.create();
        for (const pdfData of pdfs) {
            const pdf = await PDFDocument.load(pdfData);
            const copiedPages = await mergedPdf.copyPages(
                pdf,
                pdf.getPageIndices()
            );
            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        }

        const mergedPdfData = await mergedPdf.save();
        return success(mergedPdfData);
    } catch (error) {
        return failure(new UnexpectedError(error));
    }
}
