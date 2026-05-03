export type ImageGenerationMode = "text2img" | "img2img";

export type ImageAssetKind = "reference" | "generated";

export type ImageEditMessage = {
    id: string;
    role: "user" | "model";
    text?: string;
    imageIds?: string[];
    createdAt: string;
};

export type ImageSession = {
    id: string;
    title: string;
    mode: ImageGenerationMode;
    createdAt: string;
    updatedAt: string;
    messages: ImageEditMessage[];
    currentImageId?: string;
    referenceImageIds: string[];
    model: string;
};

export type StoredImageAssetMeta = {
    id: string;
    sessionId: string;
    createdAt: string;
    mimeType: string;
    width?: number;
    height: number;
    kind: ImageAssetKind;
};