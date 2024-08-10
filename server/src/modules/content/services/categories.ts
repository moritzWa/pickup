export enum ParentCategory {
    TechnologyIndustry = "Technology & Industry",
    BusinessManagement = "Business & Management",
    SocietyCulture = "Society & Culture",
}

export type SubCategory = string;

export type Category = {
    name: string;
    emoji: string;
    subcategories: SubCategory[];
};

export type CategorySection = {
    name: ParentCategory;
    categories: Category[];
};

export const CATEGORIES: CategorySection[] = [
    {
        name: ParentCategory.TechnologyIndustry,
        categories: [
            {
                name: "Startups",
                emoji: "🚀",
                subcategories: [
                    "Startup Ideas",
                    "Fundraising",
                    "Product Management",
                    "Hiring",
                    "Growth",
                ],
            },
            {
                name: "Software Engineering",
                emoji: "💻",
                subcategories: [
                    "AI & Machine Learning",
                    "Security",
                    "Cloud Computing",
                    "Hardware",
                    "Infrastructure",
                    "Web3",
                ],
            },
            {
                name: "Venture Capital & Investment",
                emoji: "💰",
                subcategories: [
                    "Vertical SaaS",
                    "Health Tech",
                    "Enterprise",
                    "Defense",
                    "Crypto",
                    "Fintech",
                    "Climate Tech",
                    "Consumer",
                    "Games",
                    "Robotics",
                    "Transportation & EVs",
                ],
            },
            {
                name: "Corporate Technology",
                emoji: "🏢",
                subcategories: [
                    "Apple",
                    "Google",
                    "Microsoft",
                    "Meta",
                    "Amazon",
                    "TikTok",
                    "OpenAI",
                    "Transportation & EVs",
                ],
            },
        ],
    },
    {
        name: ParentCategory.BusinessManagement,
        categories: [
            {
                name: "Entrepreneurship",
                emoji: "💼",
                subcategories: ["Becoming a Founder", "Company Stages"],
            },
            {
                name: "Business Models",
                emoji: "📊",
                subcategories: ["Monetization", "Pricing", "Unit Economics"],
            },
            {
                name: "Finance & Legal",
                emoji: "💵",
                subcategories: ["Cash Burn", "Legal Issues"],
            },
            {
                name: "Management",
                emoji: "📈",
                subcategories: ["Leadership", "Culture", "Compensation"],
            },
            {
                name: "International Business",
                emoji: "🌎",
                subcategories: ["Global Expansion", "China"],
            },
        ],
    },
    {
        name: ParentCategory.SocietyCulture,
        categories: [
            {
                name: "Technology & Society",
                emoji: "🔍",
                subcategories: [
                    "Privacy",
                    "Tech & Politics",
                    "US Politics",
                    "Tech & Education",
                    "Tech & Law",
                    "Science",
                    "Philosophy",
                    "Epistemology",
                    "Science of Progress",
                ],
            },
            {
                name: "Arts & Culture",
                emoji: "🎨",
                subcategories: [
                    "Design",
                    "Media & Entertainment",
                    "Literature",
                    "Music",
                    "Fashion & Beauty",
                    "Food",
                    "Sports",
                ],
            },
            {
                name: "Health & Wellness",
                emoji: "🏥",
                subcategories: [
                    "Mental Health",
                    "Health Tech",
                    "Lifestyle",
                    "Faith & Spirituality",
                    "Climate & Environment",
                ],
            },
        ],
    },
];
