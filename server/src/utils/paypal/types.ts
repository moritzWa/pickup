export enum PaypalEventType {
    OrderCompleted = "CHECKOUT.ORDER.COMPLETED",
    OrderApproved = "CHECKOUT.ORDER.APPROVED",
}

export type PaypalWebhookLink = {
    href: string;
    rel: string;
    method: "GET" | "POST";
};

export type PaypalPurchaseUnit = {
    reference_id: string;
    amount: {
        currency_code: "USD";
        value: string;
    };
};

export enum PaypalResourceStatus {
    CREATED = "CREATED",
    SAVED = "SAVED",
    APPROVED = "APPROVED",
    VOIDED = "VOIDED",
    COMPLETED = "COMPLETED",
    PAYER_ACTION_REQUIRED = "PAYER_ACTION_REQUIRED",
}

export type PaypalOrder = {
    id: string;
    status: PaypalResourceStatus;
    intent: "CAPTURE" | "AUTHORIZE";
    gross_amount: { currency_code: "USD"; value: string };
    payer: {
        name: any;
        email_address: string;
        payer_id: string;
    };
    purchase_units: PaypalPurchaseUnit[];
    create_time: string; // "2018-04-01T21:18:49Z";
    update_time: string; // "2018-04-01T21:20:49Z";
    links: PaypalWebhookLink[];
};

export type PaypalWebhookEvent = {
    id: string;
    create_time: string; // '2018-04-16T21:21:49.000Z',
    event_type: PaypalEventType;
    resource_type: string;
    resource_version: string;
    summary: string;
    resource: PaypalOrder;
    links: PaypalWebhookLink[];
    zts: number;
    event_version: string;
};

export type PaypalBearerTokenResponse = {
    scope: string;
    access_token: string;
    token_type: "Bearer";
    app_id: string;
    expires_in: number;
    nonce: string;
};
