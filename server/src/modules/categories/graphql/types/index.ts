export * from "./CategoryMetadata";
export * from "./CategorySummary";
import { enumType } from "nexus";
import { Category, CategorySlug } from "src/core/infra/postgres/entities/Token";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";

// enums
export const CategoryEnum = enumType({
    name: "CategoryEnum",
    members: Category,
});

export const CategorySlugEnum = enumType({
    name: "CategorySlugEnum",
    members: CategorySlug,
});

export const CATEGORY_GQL_TO_DOMAIN: Record<
    NexusGenEnums["CategoryEnum"],
    Category
> = {
    politics: Category.Politics,
    united_nations: Category.UnitedNations,
    religion: Category.Religion,
    celebrities: Category.Celebrities,
    athletes: Category.Athletes,
    corporations: Category.Corporations,
    executives: Category.Executives,
    dogs: Category.Dogs,
    cats: Category.Cats,
    media: Category.Media,
    sports: Category.Sports,
    influencers: Category.Influencers,
    actors: Category.Actors,
    birds: Category.Birds,
    rappers: Category.Rappers,
    characters: Category.Characters,
    trump: Category.Characters,
    presidential_candidates_twenty_four:
        Category.PresidentialCandidatesTwentyFour,
    bonk: Category.Bonk,
    memes: Category.Memes,
    frogs: Category.Frogs,
};
