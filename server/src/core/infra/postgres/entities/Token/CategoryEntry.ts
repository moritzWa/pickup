import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinColumn,
    ManyToOne,
    Relation,
    Index,
    Unique,
} from "typeorm";
import BigNumber from "bignumber.js";
import { Maybe } from "src/core/logic";
import { Token } from ".";
import { capitalize } from "lodash";

export enum Category {
    UnitedNations = "united_nations",
    Politics = "politics",
    Religion = "religion",
    Celebrities = "celebrities",
    Athletes = "athletes",
    Corporations = "corporations",
    Executives = "executives",
    Dogs = "dogs",
    Cats = "cats",
    Media = "media",
    Sports = "sports",
    Influencers = "influencers",
    Actors = "actors",
    Birds = "birds", // bcoq! peng!
    Rappers = "rappers", // Soulja boy, dwake
    Characters = "characters", // Austin Powers
    Trump = "trump", // maga, trump, etc.
    PresidentialCandidatesTwentyFour = "presidential_candidates_twenty_four", // modi, votedoge, voteshiba, tremp, boden, vledemir?, rishi moonak
    Bonk = "bonk", // bonk, bonk of america
    Memes = "memes",
    Frogs = "frogs",
}

export enum CategorySlug {
    UnitedNations = "countries",
    Politics = "politics",
    Religion = "religions",
    Celebrities = "celebrities",
    Athletes = "athletes",
    Corporations = "corporations",
    Executives = "executives",
    Dogs = "dogs",
    Cats = "cats",
    Media = "media",
    Sports = "sports",
    Influencers = "influencers",
    Actors = "actors",
    Birds = "birds",
    Rappers = "rappers",
    Characters = "characters",
    Trump = "trump",
    Bonk = "bonk",
    Memes = "memes",
    PresidentialCandidatesTwentyFour = "presidential_candidates_twenty_four",
    Frogs = "frogs",
}

const CATEGORY_TO_SLUG: Record<Category, CategorySlug> = {
    [Category.UnitedNations]: CategorySlug.UnitedNations,
    [Category.Politics]: CategorySlug.Politics,
    [Category.Religion]: CategorySlug.Religion,
    [Category.Celebrities]: CategorySlug.Celebrities,
    [Category.Athletes]: CategorySlug.Athletes,
    [Category.Corporations]: CategorySlug.Corporations,
    [Category.Executives]: CategorySlug.Executives,
    [Category.Dogs]: CategorySlug.Dogs,
    [Category.Cats]: CategorySlug.Cats,
    [Category.Media]: CategorySlug.Media,
    [Category.Sports]: CategorySlug.Sports,
    [Category.Influencers]: CategorySlug.Influencers,
    [Category.Actors]: CategorySlug.Actors,
    [Category.Birds]: CategorySlug.Birds,
    [Category.Rappers]: CategorySlug.Rappers,
    [Category.Characters]: CategorySlug.Characters,
    [Category.Trump]: CategorySlug.Trump,
    [Category.Bonk]: CategorySlug.Bonk,
    [Category.Memes]: CategorySlug.Memes,
    [Category.PresidentialCandidatesTwentyFour]:
        CategorySlug.PresidentialCandidatesTwentyFour,
    [Category.Frogs]: CategorySlug.Frogs,
};

const CATEGORY_SLUG_TO_ICON_IMAGE_URL: Record<CategorySlug, string | null> = {
    [CategorySlug.UnitedNations]:
        "https://firebasestorage.googleapis.com/v0/b/awaken-trading-production.appspot.com/o/categories%2Fnationfi.png?alt=media&token=e2db4222-be5e-470d-85bc-efbfe4b53648",
    [CategorySlug.Politics]:
        "https://firebasestorage.googleapis.com/v0/b/awaken-trading-production.appspot.com/o/categories%2Fpolitics.jpeg?alt=media&token=5e5d4817-2b9e-4d58-847f-47c1145b1143",
    [CategorySlug.Religion]:
        "https://firebasestorage.googleapis.com/v0/b/awaken-trading-production.appspot.com/o/categories%2Freligion.jpeg?alt=media&token=542f55f6-7dfb-4ef3-8fda-89a0d79b18fe",
    [CategorySlug.Celebrities]:
        "https://assets.movement.market/categories/influencers.jpg",
    // "https://firebasestorage.googleapis.com/v0/b/awaken-trading-production.appspot.com/o/categories%2Fcelebrities.jpeg?alt=media&token=5772f05d-e067-41af-a060-221a7daf485f",
    [CategorySlug.Athletes]:
        "https://assets.movement.market/categories/athletes.png",
    [CategorySlug.Corporations]:
        "https://assets.movement.market/categories/corporations.png",
    [CategorySlug.Executives]:
        "https://assets.movement.market/categories/executives.jpg",
    [CategorySlug.Dogs]: "https://assets.movement.market/categories/dogs.jpg",
    [CategorySlug.Cats]: "https://assets.movement.market/categories/cats.jpg",
    [CategorySlug.Media]: "https://assets.movement.market/categories/media.jpg",
    [CategorySlug.Sports]:
        "https://assets.movement.market/categories/sports.jpg",
    [CategorySlug.Influencers]:
        "https://assets.movement.market/categories/influencers.jpg",
    [Category.Actors]: "https://assets.movement.market/categories/actors.png",
    [Category.Birds]: "https://assets.movement.market/categories/birds.png",
    [Category.Rappers]: "https://assets.movement.market/categories/rappers.jpg",
    [Category.Characters]:
        "https://assets.movement.market/categories/characters.jpg",
    [Category.Trump]: "https://assets.movement.market/categories/trump.png",
    [Category.Bonk]: "https://assets.movement.market/categories/bonk.png",
    [Category.Memes]: "https://assets.movement.market/categories/memes.jpg",
    [Category.PresidentialCandidatesTwentyFour]:
        "https://assets.movement.market/categories/presidential-candidates-twenty-four.jpg",
    [Category.Frogs]: "https://assets.movement.market/categories/frogs.jpg",
};

// https://uigradients.com/
const CATEGORY_SLUG_TO_BANNER_IMAGE_URL: Record<CategorySlug, string | null> = {
    [CategorySlug.UnitedNations]:
        "https://firebasestorage.googleapis.com/v0/b/awaken-trading-production.appspot.com/o/categories%2FBack%20To%20Earth.jpg?alt=media&token=e20831f1-5899-433a-87b9-6fcd332854e3",
    [CategorySlug.Politics]:
        "https://firebasestorage.googleapis.com/v0/b/awaken-trading-production.appspot.com/o/categories%2FWiretap.jpg?alt=media&token=df3ad4fb-d491-49cc-a3f4-c2213936aec0",
    [CategorySlug.Religion]:
        "https://firebasestorage.googleapis.com/v0/b/awaken-trading-production.appspot.com/o/categories%2FSunkist.png?alt=media&token=e842e51d-020c-422d-a687-68791f604c55",
    [CategorySlug.Celebrities]: null,
    [CategorySlug.Athletes]: null,
    [CategorySlug.Corporations]: null,
    [CategorySlug.Executives]: null,
    [CategorySlug.Dogs]: null,
    [CategorySlug.Cats]:
        "https://firebasestorage.googleapis.com/v0/b/awaken-trading-production.appspot.com/o/categories%2FBack%20To%20Earth.jpg?alt=media&token=e20831f1-5899-433a-87b9-6fcd332854e3",
    [CategorySlug.Media]: null,
    [CategorySlug.Sports]: null,
    [CategorySlug.Influencers]: null,
    [Category.Actors]: null,
    [Category.Birds]: null,
    [Category.Rappers]: null,
    [Category.Characters]: null,
    [Category.Trump]: null,
    [Category.Bonk]: null,
    [Category.Memes]: null,
    [Category.PresidentialCandidatesTwentyFour]: null,
    [Category.Frogs]: null,
};

const SLUG_TO_CATEGORY = Object.entries(CATEGORY_TO_SLUG).reduce(
    (acc, [category, slug]) => ({
        ...acc,
        [slug]: category,
    }),
    {} as Record<CategorySlug, Category>
);

const CATEGORY_TO_DESCRIPTION: Record<CategorySlug, string> = {
    [CategorySlug.UnitedNations]:
        "Global dreams where borders are memes and every coin promises moonshots. 🚀🌍",
    [CategorySlug.Politics]:
        "We know exactly what we are doing. We are going to change the world for you, and make it better, and make it so amazing and grand...... How we're going to do it? We have this grand plan. This big, awesome plan. Just vote for us and wait and see!",
    [CategorySlug.Religion]:
        "God is great. We may disagree on how history brought us to where we stand, but we all share the same values of humility, service, and integrity. Through these coins, we hope to create more attention around God, promote our ideologies, and make this world a better place.",
    [CategorySlug.Celebrities]:
        "These are tokens created by celebrities themselves. You will see a golden checkmark, meaning we have verified that this is the celebrity's actual token that they created - not a duplicate.",
    [CategorySlug.Athletes]:
        "We are the best in the world. Oh, our 0-6 loss last year against the Fudgey Figgletons? Yeah, but that was the past. I never lose, except that one time. Let's crush these charts!",
    [CategorySlug.Corporations]:
        "Just trust us with all of your money, and we will keep it safe. But before we move forward, please sign this 3,000 page document that says if you lose all your money, it has nothing to do with us. Thank you for your business!",
    [CategorySlug.Executives]:
        "We are the richest, most powerful people on the planet. We did *not* have our advisors write this. Invest in us and we are going to change the world -- and your bank account!",
    [CategorySlug.Dogs]:
        "Dogs wif hats, dogs wifout hats, hats wif dogs, and everything in between! We are arguably the cutest, most likeable thing the world has ever seen. The cats aren't even competition.",
    [CategorySlug.Cats]:
        "Meow. Meow meow meowmeow. We are pDogs poop all over your house, we will never do that. Purrfectly poised to take over your portfolio with cuteness overload.",
    [CategorySlug.Media]:
        "BREAKING NEWS: The media category has launched with the goal of keeping track of every event in the world -- especially the ones that get you to click.",
    [CategorySlug.Sports]:
        "Football, dodgeball, quidditch, and everything in between! We are the champions, my friends. And we'll keep on fighting till the end. Because we are the champions... We are the champions! No time for losers, 'cause we are the champions of the world!",
    [CategorySlug.Influencers]:
        "These are tokens created by influencers themselves. You will see a golden checkmark, meaning we have verified that this is the influencer's actual token that they created - not a duplicate.",
    [Category.Actors]:
        "When we were young, our parents noticed we had an extraordinary talent for lying, so they put us in acting. Now we are some of the most loved people in the world!",
    [Category.Birds]:
        "Penguins, ducks, cocks... Whatever you need, we got it all. KA KAAAH!",
    [Category.Rappers]:
        "Yo, man if you don't listen to my music then you dumb. My music so fire it's gonna make you c...... want to buy my coin.", // come ... dumb, thumb,
    [Category.Characters]: "The best (and worst) movie characters ever.",
    [Category.Trump]:
        "BUILD THE WALL!! 🇺🇸 MAKE AMERICA GREAT AGAIN!! 🇺🇸 GRAB HER BY THE ... Oh, wait. MAKE AMERICA GREAT AGAIN!! 🇺🇸", // hahahahah we have to keep this!!
    [Category.Bonk]:
        "Bonk, Bonk of America, Bonk with extra arms, Bonk without arms... You get the point.",
    [Category.Memes]: "The timeless memes of the internet.",
    [Category.PresidentialCandidatesTwentyFour]:
        "Our world is at the point of collapse, and you need to vote for ME to fix it. That guy competing against me over there is a scam -- don't listen to him. I promise I will fix everything.",
    [Category.Frogs]: "",
    // superheroes: Honey... Where's my super suit ??
};

type CategoryStyle = {
    textColor: string;
    backgroundColor: string;
    borderColor: string;
    emoji: string;
};

const CATEGORY_TO_STYLE: Record<CategorySlug, CategoryStyle> = {
    [CategorySlug.UnitedNations]: {
        textColor: "white",
        backgroundColor: "#5b92e5", // this is the UN color
        borderColor: "#446DAB",
        emoji: "🇺🇳",
    },
    [CategorySlug.Politics]: {
        textColor: "white",
        backgroundColor: "#FC6E6E",
        borderColor: "#CD5B5B",
        emoji: "🏛️",
    },
    [CategorySlug.Religion]: {
        textColor: "white",
        backgroundColor: "#a27c4c",
        borderColor: "#5a452a",
        emoji: "🙏",
    },
    [CategorySlug.Celebrities]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "🕺",
    },
    [CategorySlug.Athletes]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "⚽️",
    },
    [CategorySlug.Corporations]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "🏭",
    },
    [CategorySlug.Executives]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "🕴️",
    },
    [CategorySlug.Dogs]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "🐶",
    },
    [CategorySlug.Cats]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "🐈",
    },
    [CategorySlug.Media]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "🗞️",
    },
    [CategorySlug.Sports]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "🏅",
    },
    [CategorySlug.Influencers]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "📸",
    },
    [Category.Actors]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "📺",
    },
    [Category.Birds]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "🐥",
    },
    [Category.Rappers]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "🎤",
    },
    [Category.Characters]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "📹",
    },
    [Category.Trump]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "🧱",
    },
    [Category.Bonk]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "🕺",
    },
    [Category.Memes]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "🖼️",
    },
    [Category.PresidentialCandidatesTwentyFour]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "🌐",
    },
    [Category.Frogs]: {
        textColor: "white",
        backgroundColor: "#8600c4",
        borderColor: "#7a00b3",
        emoji: "🐸",
    },
};

export const categoryEnumToName = (category: Category): string => {
    switch (category) {
        case Category.UnitedNations:
            return "Countries";
        default:
            return capitalize(category.toString().split("_").join(" "));
    }
};

export const categoryEnumToStyle = (
    category: Category
): Maybe<CategoryStyle> => {
    return CATEGORY_TO_STYLE[category] ?? null;
};

export type CategoryMetadata = {
    type: Category;
    categoryName: string;
    description: string;
    slug: Maybe<string>;
    iconImageUrl: Maybe<string>;
    bannerImageUrl: Maybe<string>;
};

export const getCategoryMetadata = (category: Category): CategoryMetadata => {
    return {
        type: category,
        categoryName: categoryEnumToName(category),
        description: getCategoryDescription(getCategorySlug(category)),
        slug: getCategorySlug(category),
        iconImageUrl: getCategoryIconUrl(getCategorySlug(category)),
        bannerImageUrl: getCategoryBannerUrl(getCategorySlug(category)),
    } as CategoryMetadata;
};

export const getCategoryForSlug = (slug: string): Maybe<Category> => {
    return SLUG_TO_CATEGORY[slug as CategorySlug] ?? null;
};

export const getCategorySlug = (category: Category): Maybe<CategorySlug> => {
    return CATEGORY_TO_SLUG[category] ?? null;
};

export const getCategoryIconUrl = (
    slug: CategorySlug | null
): Maybe<string> => {
    return CATEGORY_SLUG_TO_ICON_IMAGE_URL[slug || ""] ?? null;
};

export const getCategoryBannerUrl = (
    slug: CategorySlug | null
): Maybe<string> => {
    return CATEGORY_SLUG_TO_BANNER_IMAGE_URL[slug || ""] ?? null;
};

export const getCategoryDescription = (
    slug: CategorySlug | null
): Maybe<string> => {
    return CATEGORY_TO_DESCRIPTION[slug || ""] ?? null;
};

@Entity({
    name: "category_entries",
})
@Unique("category_entry_token_idx", ["tokenId", "category"])
export class CategoryEntry {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "enum",
        name: "category",
        enum: Category,
        enumName: "category_enum",
    })
    @Index("category_entry_idx")
    category!: Category;

    @ManyToOne(() => Token, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "token_id" })
    token!: Relation<Token>;

    @Column({
        nullable: false,
        type: "uuid",
        name: "token_id",
    })
    tokenId!: string;

    /*
     * deprecated - now on Token
     */
    @Column({
        nullable: true,
        type: "text",
        name: "name",
    })
    name!: Maybe<string>; // e.g. country name, politician name

    @Column({
        nullable: false,
        type: "timestamp",
        name: "created_at",
        default: () => "NOW()",
    })
    createdAt!: Date;

    @Column({
        nullable: false,
        type: "timestamp",
        name: "updated_at",
        default: () => "NOW()",
    })
    updatedAt!: Date;
}
