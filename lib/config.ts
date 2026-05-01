export const config = {
  addPassword: process.env.APP_PASSWORD || "testpass",

  googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT || "",
  googleCloudLocation: process.env.GOOGLE_CLOUD_LOCATION || "",

  geminiChatModel: process.env.GEMINI_CHAT_MODEL || "gemini-3.1-pro-preview",

};