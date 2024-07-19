import { PDFDocument } from "pdf-lib";
import {
    success,
    failure,
    FailureOrSuccess,
    DefaultErrors,
    UnexpectedError,
} from "src/core/logic";

export enum PdfFieldEnum {
    Text = "text",
    Checkbox = "checkbox",
}

export type PdfTextField = {
    type: PdfFieldEnum.Text;
    value: string;
    name: string;
};

export type PdfCheckboxField = {
    type: PdfFieldEnum.Checkbox;
    value: boolean;
    name: string;
};

export type PdfField = PdfTextField | PdfCheckboxField;

// Fills in a PDF form with values provided in fields array
// NOTE: We may need to add support for more fields as we start handling more
export const fillPdfForm = async (
    pdfData: ArrayBuffer,
    fields: PdfField[]
): Promise<FailureOrSuccess<DefaultErrors, ArrayBuffer>> => {
    try {
        const pdf = await PDFDocument.load(pdfData);
        const pdfForm = pdf.getForm();

        fields.forEach(({ name, value, type }) => {
            switch (type) {
                case "text":
                    pdfForm.getTextField(name).setText(String(value));
                    break;
                case "checkbox":
                    const field = pdfForm.getCheckBox(name);
                    if (!!value) field.check();
                    else field.uncheck();
                    break;
                default:
                    throw new Error(
                        `PDF field type ${type} is not yet supported.`
                    );
            }
        });

        return success(await pdf.save());
    } catch (error) {
        return failure(new UnexpectedError(error));
    }
};
