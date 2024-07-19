const { pathsToModuleNameMapper } = require("ts-jest");
const tsConfig = require("../../../tsconfig.test.json");

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    rootDir: "../../",
    preset: "ts-jest",
    forceExit: true,
    testPathIgnorePatterns: [
        "node_modules",
        "src/__tests__/config",
        "TestController.ts",
        "mocks",
        "factories",
    ],
    transform: {
        "^.+\\.ts?$": "ts-jest",
    },
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$",
    moduleDirectories: ["node_modules"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    moduleNameMapper: {
        "./src/(.*)": "<rootDir>/src/$1",
    },
    modulePaths: ["<rootDir>"],
    setupFilesAfterEnv: [
        "./__tests__/config/BeforeAll.ts",
        "./__tests__/config/DefaultMocks.ts",
    ],
    globals: {
        NODE_ENV: "test",
        "ts-jest": {
            tsconfig: "<rootDir>/../tsconfig.test.json",
            isolatedModules: true,
            diagnostics: true,
        },
    },
};
