import * as _ from "lodash";

// Mock stripe
jest.mock("stripe", () => {
    const stripeMock = require("./mocks/StripeMock");
    return stripeMock.mockedImplementation();
});

// Mock utility classes
// mocking: https://medium.com/@rickhanlonii/understanding-jest-mocks-f0046c68e53c
jest.mock("../utils/sendgrid.ts");
jest.mock("../utils/sentry.ts");
jest.mock("../utils/slack.ts");

// Should be using mocked module
// var stripe = require("stripe")(config.stripeSecret);
// stripe.setApiVersion("2018-11-08");

class TestController {
    async wait(milliseconds) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, milliseconds);
        });
    }

    async setup({ skipDbConnection }: { skipDbConnection?: boolean }) {
        process.env.STRIPE_SECRET = "STRIPE_SECRET";

        // await loadAll({ skipDbConnection });
    }

    async wipe(collections?: string[]) {}

    async tearDown() {}
}

export type RequestMethod = "GET" | "DELETE" | "POST" | "PUT";

export class Route {
    public method: string;
    public endpoint: string;
    public defaultArgs?: {};

    constructor(
        method: RequestMethod,
        endpoint: string,
        defaultArgs: any = {}
    ) {
        this.method = method;
        this.endpoint = endpoint;
        this.defaultArgs = defaultArgs;
    }

    public urlWithArgs(args: any = {}) {
        let url = this.endpoint;

        for (let arg in args) {
            url = url.replace(arg, args[arg]);
        }

        return url;
    }

    public getArgs(args: any = {}) {
        if (!this.defaultArgs) return args;
        if (!args) return this.defaultArgs;

        return {
            ...this.defaultArgs,
            ...args,
        };
    }

    public description() {
        return `${this.method} ${this.endpoint}`;
    }
}

export default new TestController();
