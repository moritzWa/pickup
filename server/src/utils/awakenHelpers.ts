import { config } from "src/config";

export const buildAwakenURL = (clientId: string, transactionId?: string) =>
    transactionId
        ? `${config.urls.frontend}/clients/${clientId}/transactions/?transactionId=${transactionId}`
        : `${config.urls.frontend}/clients/${clientId}`;
