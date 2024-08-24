import { mutationField, nonNull, stringArg } from "nexus";
import { v4 as uuidv4 } from "uuid";
import { authorRepo } from "../../infra";
import { Author } from "../types";

export const createAuthor = mutationField("createAuthor", {
    type: Author,
    args: {
        name: nonNull(stringArg()),
        imageUrl: stringArg(),
    },
    resolve: async (_parent, { name, imageUrl }) => {
        const authorResponse = await authorRepo.create({
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
            name,
            imageUrl: imageUrl ?? null,
            contents: [],
        });
        if (authorResponse.isFailure()) {
            throw new Error(authorResponse.error.message);
        }
        return authorResponse.value;
    },
});
