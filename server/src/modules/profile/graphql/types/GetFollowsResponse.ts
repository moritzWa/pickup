import { list, nonNull, objectType } from "nexus";

export const GetFollowsResponse = objectType({
    name: "GetFollowsResponse",
    definition(t) {
        t.nonNull.field("followers", {
            type: nonNull(list(nonNull("PublicProfileInfo"))),
        });
        t.nonNull.field("following", {
            type: nonNull(list(nonNull("PublicProfileInfo"))),
        });
    },
});
