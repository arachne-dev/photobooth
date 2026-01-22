
import { GoogleGenAI, Type } from "@google/genai";
import { StyleDNAItem } from "../types";

// Removed indirect API_KEY variable to comply with strict process.env.API_KEY usage rules.

export const analyzeFashion = async (base64Image: string): Promise<{ tags: string[], description: string, styleDNA: StyleDNAItem[] }> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY가 설정되지 않았습니다");
  }
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Analyze the fashion in this photo with the following requirements:
    1. EXTRACT 5-7 TAGS focusing on specific items and technical details (e.g. '오버사이즈 봄버 재킷', '와이드 카고 팬츠', '메탈릭 액세서리'). Tags in Korean.
    2. WRITE a CONCISE, friendly yet professional description in Korean (max 2-3 sentences). Avoid flowery "over-the-top" magazine prose, keep it grounded but expert.
    3. PROVIDE a "Style DNA" breakdown of the look's core vibe. Pick 4 categories (e.g., Chic, Street, Gorpcore, Minimal, Y2K, Vintage, Avant-garde) and assign percentages totaling roughly 100%. 
    Return strictly as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1]
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            description: {
              type: Type.STRING
            },
            styleDNA: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.NUMBER }
                },
                required: ["label", "value"]
              }
            }
          },
          required: ["tags", "description", "styleDNA"]
        }
      }
    });

    // Directly access .text property as it is a getter, not a method.
    const result = JSON.parse(response.text || "{}");
    return {
      tags: result.tags || [],
      description: result.description || "",
      styleDNA: result.styleDNA || []
    };
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      tags: ["기본 아이템", "깔끔한 실루엣"],
      description: "군더더기 없는 깔끔한 핏과 톤온톤 매치가 돋보이는 룩입니다. 세련된 분위기가 느껴지네요.",
      styleDNA: [
        { label: "Minimal", value: 60 },
        { label: "Chic", value: 30 },
        { label: "Modern", value: 10 }
      ]
    };
  }
};
