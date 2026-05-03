import type { ImageSession } from "./image-session-types";

const STORAGE_KEY = "easyportal:image-sessions:v1";
const CURRENT_SESSION_KEY = "easyportal:current-image-session-id:v1";

export function loadImageSessions(): ImageSession[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed as ImageSession[];
  } catch {
    return [];
  }
}

export function saveImageSessions(sessions: ImageSession[]): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function loadCurrentImageSessionId(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(CURRENT_SESSION_KEY);
}

export function saveCurrentImageSessionId(sessionId: string): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
}

export function createImageSession(params?: {
  model?: string;
  mode?: "text2img" | "img2img";
}): ImageSession {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title: "新しい画像編集",
    mode: params?.mode ?? "img2img",
    model: params?.model ?? "gemini-3.1-flash-image-preview",
    createdAt: now,
    updatedAt: now,
    messages: [],
    referenceImageIds: [],
  };
}