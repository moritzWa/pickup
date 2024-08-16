import { Author } from "src/core/infra/postgres/entities";
import { authorRepo } from "../infra";
import { v4 as uuidv4 } from "uuid";
import { DefaultErrors, failure, FailureOrSuccess } from "src/core/logic";
import { select } from "radash";

const findOrCreate = async (
    name: string,
    a: Partial<Author>
): Promise<FailureOrSuccess<DefaultErrors, Author>> => {
    const authorResponse = await authorRepo.findForName(name);

    if (authorResponse.isSuccess()) {
        return authorResponse;
    }

    const author: Omit<Author, "contents"> = {
        id: uuidv4(),
        imageUrl: a.imageUrl || "",
        name,
    };

    const saveResponse = await authorRepo.save(author);

    if (saveResponse.isFailure()) {
        return failure(saveResponse.error);
    }

    return saveResponse;
};

export const AuthorService = {
    findOrCreate,
};
