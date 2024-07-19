jest.mock("../../utils/Firebase", () => {
    const { FirebaseMock } = require("../mocks/FirebaseMock");
    return FirebaseMock;
});
