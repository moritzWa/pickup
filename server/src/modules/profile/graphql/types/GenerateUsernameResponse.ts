import { objectType } from "nexus";

export const GenerateUsernameResponse = objectType({
    name: "GenerateUsernameResponse",
    definition(t) {
        t.nonNull.string("username");
        t.nonNull.string("name");
    },
});
