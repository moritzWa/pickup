import { Category } from "src/core/infra/postgres/entities";

export enum ParentCategory {
    Business = "Business",
    More = "More",
}

export const CATEGORIES = [
    {
        label: "Business",
        value: ParentCategory.Business,
        categories: [
            {
                label: "Entrepreneurship",
                value: Category.Entrepreneurship,
                emoji: "💼",
            },
            {
                label: "Public Speaking",
                value: Category.PublicSpeaking,
                emoji: "🎤",
            },
            {
                label: "Negotiation",
                value: Category.Negotiation,
                emoji: "🤝",
            },
            {
                label: "Product",
                value: Category.Product,
                emoji: "📦",
            },
            {
                label: "Hiring",
                value: Category.Hiring,
                emoji: "👥",
            },
        ],
    },
    {
        label: "More...",
        value: ParentCategory.More,
        categories: [
            {
                label: "Language",
                value: Category.Language,
                emoji: "🗣️",
            },
            {
                label: "History",
                value: Category.History,
                emoji: "📜",
            },
            {
                label: "Science",
                value: Category.Science,
                emoji: "🔬",
            },
            {
                label: "Philosophy",
                value: Category.Philosophy,
                emoji: "🤔",
            },
            {
                label: "Comedy",
                value: Category.Comedy,
                emoji: "😂",
            },
        ],
    },
];
