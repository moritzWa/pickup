import TestController from "../TestController";

beforeAll(async () => {
    await TestController.setup({ skipDbConnection: true });
});

afterAll(async () => {
    await TestController.tearDown();
});
