import { GoogleGenAI } from "@google/genai";
import { config } from "@/lib/config";

export const ai = new GoogleGenAI({
  vertexai : true,
  project: config.googleCloudProject,
  location: config.googleCloudLocation,
});