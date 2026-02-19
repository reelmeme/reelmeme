import { GoogleGenAI, Type } from "@google/genai";
import { MemeResult, MemeTone } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are a professional viral Reel Meme creator for an edgy, internet-native Gen-Z/Millennial audience (18–30).
Your task is to generate exactly four short, punchy meme captions and exactly one trending Reel song suggestion for each style.

HUMOR VIBE:
- Edgy, slightly unhinged, and confident.
- Themes: chill, lazy, confidence, situationships, internet sarcasm, low-effort high-impact energy.
- "IYKYK" style jokes.
- Tone: Sound like a popular meme page, not a corporate tool.

STRICT CAPTION RULES:
- EXACTLY 4 styles: Funny, Sarcastic, Savage, Relatable.
- Max 2 lines per caption.
- Max 5 words per line.
- Prefer 1 line if possible.
- Use casual internet English (lowercase preferred, no formal grammar).
- NO emojis inside the meme text.
- NEVER explain the joke.
- NEVER describe the image literally.
- Avoid flat or generic humor.

REEL SONG RULES:
- Suggest exactly 1 popular song for Instagram/Facebook Reels for each style.
- Reason for song must be max 4 words.

Output must be strictly valid JSON.`;

export const generateMemeData = async (
  input: { base64Image?: string; mimeType?: string }
): Promise<MemeResult> => {
  const model = "gemini-3-flash-preview";
  
  const contents: any = [];
  
  if (input.base64Image) {
    contents.push({
      inlineData: {
        data: input.base64Image,
        mimeType: input.mimeType || 'image/jpeg'
      }
    });
  }

  const prompt = "Generate a viral, edgy Reel Meme for this image. Use internet slang and unhinged humor. Lowercase preferred. Max 5 words per line.";

  contents.push({ text: prompt });

  const response = await ai.models.generateContent({
    model,
    contents: { parts: contents },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          captions: {
            type: Type.OBJECT,
            properties: {
              funny: { type: Type.STRING },
              sarcastic: { type: Type.STRING },
              savage: { type: Type.STRING },
              relatable: { type: Type.STRING }
            },
            required: ["funny", "sarcastic", "savage", "relatable"]
          },
          songs: {
            type: Type.OBJECT,
            properties: {
              funny: { 
                type: Type.OBJECT, 
                properties: { name: {type: Type.STRING}, artist: {type: Type.STRING}, reason: {type: Type.STRING} },
                required: ["name", "artist", "reason"]
              },
              sarcastic: { 
                type: Type.OBJECT, 
                properties: { name: {type: Type.STRING}, artist: {type: Type.STRING}, reason: {type: Type.STRING} },
                required: ["name", "artist", "reason"]
              },
              savage: { 
                type: Type.OBJECT, 
                properties: { name: {type: Type.STRING}, artist: {type: Type.STRING}, reason: {type: Type.STRING} },
                required: ["name", "artist", "reason"]
              },
              relatable: { 
                type: Type.OBJECT, 
                properties: { name: {type: Type.STRING}, artist: {type: Type.STRING}, reason: {type: Type.STRING} },
                required: ["name", "artist", "reason"]
              }
            },
            required: ["funny", "sarcastic", "savage", "relatable"]
          }
        },
        required: ["captions", "songs"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Meme logic failed to compute humor.");
  }
};
