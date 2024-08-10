import { Category } from "src/core/infra/postgres/entities";

export enum ParentCategory {
    TechnologyIndustry = "Technology & Industry",
    BusinessManagement = "Business & Management",
    SocietyCulture = "Society & Culture",
}

export const CATEGORIES = [
    {
        label: "Technology & Industry",
        value: ParentCategory.TechnologyIndustry,
        categories: [
            {
                label: "Startups",
                value: Category.Entrepreneurship,
                emoji: "🚀",
                subcategories: [
                    { label: "Startup Ideas", value: Category.StartupIdeas },
                    { label: "Fundraising", value: Category.Fundraising },
                    {
                        label: "Product Management",
                        value: Category.ProductManagement,
                    },
                    { label: "Hiring", value: Category.Hiring },
                    { label: "Growth", value: Category.Growth },
                ],
            },
            {
                label: "Software Engineering",
                value: Category.SoftwareEngineering,
                emoji: "💻",
                subcategories: [
                    { label: "AI & Machine Learning", value: "ai_ml" },
                    { label: "Security", value: "security" },
                    { label: "Cloud Computing", value: "cloud_computing" },
                    { label: "Hardware", value: "hardware" },
                    { label: "Infrastructure", value: "infrastructure" },
                ],
            },
            {
                label: "Venture Capital & Investment",
                value: Category.VentureCapital,
                emoji: "💰",
                subcategories: [
                    { label: "Vertical SaaS", value: "vertical_saas" },
                    { label: "Health Tech", value: "health_tech" },
                    { label: "Enterprise", value: "enterprise" },
                    { label: "Defense", value: "defense" },
                    { label: "Crypto", value: "crypto" },
                    { label: "Fintech", value: "fintech" },
                    { label: "Climate Tech", value: "climate_tech" },
                    { label: "Consumer", value: "consumer" },
                    { label: "Games", value: "games" },
                ],
            },
            {
                label: "Corporate Technology",
                value: Category.CorporateTech,
                emoji: "🏢",
                subcategories: [
                    { label: "Apple", value: "apple" },
                    { label: "Google", value: "google" },
                    { label: "Microsoft", value: "microsoft" },
                    { label: "Meta", value: "meta" },
                    { label: "Amazon", value: "amazon" },
                    { label: "TikTok", value: "tiktok" },
                    {
                        label: "Transportation & EVs",
                        value: "transportation_evs",
                    },
                ],
            },
        ],
    },
    {
        label: "Business & Management",
        value: ParentCategory.BusinessManagement,
        categories: [
            {
                label: "Entrepreneurship",
                value: Category.Entrepreneurship,
                emoji: "💼",
                subcategories: [
                    {
                        label: "Becoming a Founder",
                        value: "becoming_a_founder",
                    },
                    { label: "Company Stages", value: "company_stages" },
                ],
            },
            {
                label: "Business Models",
                value: Category.BusinessModels,
                emoji: "📊",
                subcategories: [
                    { label: "Monetization", value: "monetization" },
                    { label: "Pricing", value: "pricing" },
                    { label: "Unit Economics", value: "unit_economics" },
                ],
            },
            {
                label: "Finance & Legal",
                value: Category.Finance,
                emoji: "💵",
                subcategories: [
                    { label: "Cash Burn", value: "cash_burn" },
                    { label: "Legal Issues", value: Category.Legal },
                ],
            },
            {
                label: "Management",
                value: Category.Management,
                emoji: "📈",
                subcategories: [
                    { label: "Leadership", value: "leadership" },
                    { label: "Culture", value: "culture" },
                    { label: "Compensation", value: "compensation" },
                ],
            },
            {
                label: "International Business",
                value: Category.InternationalBusiness,
                emoji: "🌎",
                subcategories: [
                    { label: "Global Expansion", value: "global_expansion" },
                    { label: "China", value: "china" },
                ],
            },
        ],
    },
    {
        label: "Society & Culture",
        value: ParentCategory.SocietyCulture,
        categories: [
            {
                label: "Technology & Society",
                value: Category.TechSociety,
                emoji: "🔍",
                subcategories: [
                    { label: "Ethics in AI", value: "ethics_ai" },
                    { label: "Digital Privacy", value: "digital_privacy" },
                    { label: "Tech & Politics", value: "tech_politics" },
                    { label: "Tech & Education", value: "tech_education" },
                ],
            },
            {
                label: "Arts & Culture",
                value: Category.ArtsCulture,
                emoji: "🎨",
                subcategories: [
                    { label: "Design", value: "design" },
                    {
                        label: "Media & Entertainment",
                        value: "media_entertainment",
                    },
                    { label: "Literature", value: "literature" },
                ],
            },
            {
                label: "Health & Wellness",
                value: Category.HealthWellness,
                emoji: "🏥",
                subcategories: [
                    { label: "Mental Health", value: "mental_health" },
                    { label: "Health Tech", value: "health_tech" },
                    { label: "Lifestyle", value: "lifestyle" },
                    {
                        label: "Faith & Spirituality",
                        value: "faith_spirituality",
                    },
                    {
                        label: "Climate & Environment",
                        value: "climate_environment",
                    },
                ],
            },
        ],
    },
];
