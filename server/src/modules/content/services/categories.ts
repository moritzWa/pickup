import { Category } from "src/core/infra/postgres/entities";

export const CATEGORIES = [
    {
        label: "Language",
        value: Category.Language,
        emoji: "🗣️",
    },
    {
        label: "Entrepreneurship",
        value: Category.Entrepreneurship,
        emoji: "💼",
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
    {
        label: "Comedy",
        value: Category.Comedy,
        emoji: "😂",
    },
];
