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

export const IMAGE_MODELS = [
    {
        id: "gemini-3.1-flash-image-preview",
        name: "Nano Banana 2",
        badge: "超最新画像生成モデル",
        description: "一貫性、高品質、高画質な画像生成AI",
    },
    {
        id: "gemini-3-pro-image-preview",
        name: "Nano Banana Pro",
        badge: "最新画像生成モデル",
        description: "Nano Banana 2には劣るが高機能モデル",
    },
    {
        id: "gemini-2.5-flash-image",
        name: "Nano Banana",
        badge: "画像生成モデル",
        description: "低遅延・高頻度利用向けの画像生成モデル",
    },
] as const;

export type ImageModelId = (typeof IMAGE_MODELS)[number]["id"];

export const DEFAULT_IMAGE_MODEL: ImageModelId = "gemini-3.1-flash-image-preview";
export function isImageModelId(model: unknown): model is ImageModelId {
    return (
        typeof model === "string" &&
        IMAGE_MODELS.some((item) => item.id === model)
    );
}

export const VIDEO_MODELS = [
    {
        id: "veo-3.1-lite-generate-preview",
        name: "Veo 3.1 lite",
        badge: "最新動画生成モデル",
        description: "あのVeo 3.1を低遅延、かつ、低単価で生成可能です。",
    },
    {
        id: "veo-3.1-fast-generate-preview",
        name: "Veo 3.1 fast",
        badge: "高速な動画生成モデル",
        description: "低遅延型だが、Veo 3.1に近い精度を実現",
    },
    {
        id: "veo-3.1-generate-preview",
        name: "Veo 3.1",
        badge: "超高性能動画生成モデル",
        description: "王道を征く、Veo 3.1",
    },

] as const;

export type VideoModelId = (typeof VIDEO_MODELS)[number]["id"];

export const DEFAULT_VIDEO_MODEL: VideoModelId = "veo-3.1-fast-generate-preview";

export function isVideoModelId(model: string): model is VideoModelId {
    return (
        typeof model === "string" &&
        VIDEO_MODELS.some((item) => item.id === model)
    );
}
