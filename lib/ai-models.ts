export const CHAT_MODELS = [
    {
        id: "gemini-3.1-pro-preview",
        name: "Gemini 3.1 Pro Preview",
        badge: "高性能",
        description: "制度重視。複雑な相談・文章生成向け。",
    },
    {
        id: "gemini-3-flash-preview",
        name: "Gemini 3 Flash Preview",
        badge: "高速",
        description: "速度重視。軽い相談・要約・試用向け。",
    },
] as const;

export type ChatModelId = (typeof CHAT_MODELS)[number]["id"];

export const DEFAULT_CHAT_MODEL: ChatModelId = "gemini-3.1-pro-preview";

export function isChatModelId(model: unknown): model is ChatModelId {
    return (
        typeof model === "string" &&
        CHAT_MODELS.some((item) => item.id === model)
    );
}