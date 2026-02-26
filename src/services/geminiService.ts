import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface FoodItem {
  id?: number;
  name: string;
  category: string;
  expiry_date: string;
  status: 'fresh' | 'warning' | 'expired';
  image_url?: string;
}

export const analyzeFoodImage = async (base64Image: string): Promise<Partial<FoodItem>> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Analyze this food item or receipt. 
  Identify the main food item and its category. 
  Use ONLY these categories: Granos, Verduras, Frutas, Lácteos, Proteínas.
  Estimate its shelf life in days from today. 
  If it's a receipt, identify the most perishable item.
  Return a JSON object with: name, category, estimated_days_left.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          estimated_days_left: { type: Type.NUMBER }
        },
        required: ["name", "category", "estimated_days_left"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + result.estimated_days_left);

  let status: 'fresh' | 'warning' | 'expired' = 'fresh';
  if (result.estimated_days_left <= 2) status = 'warning';
  if (result.estimated_days_left <= 0) status = 'expired';

  return {
    name: result.name,
    category: result.category,
    expiry_date: expiryDate.toISOString(),
    status
  };
};

export const generateRecipe = async (items: FoodItem[]): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const expiringItems = items
    .filter(i => i.status !== 'expired')
    .map(i => `${i.name} (vence en ${Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} días)`)
    .join(", ");

  const prompt = `Tengo estos ingredientes que están por vencer: ${expiringItems}. 
  Sugiere una receta rápida y creativa para aprovecharlos. 
  Responde en Markdown con un título llamativo, tiempo de preparación y pasos breves. 
  Enfócate en evitar el desperdicio.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }]
  });

  return response.text || "No pude generar una receta en este momento.";
};

export const generateIndividualIcon = async (name: string, category: string, retryCount = 0): Promise<string> => {
  const model = "gemini-2.5-flash-image";
  const prompt = `3D hyperrealistic icon of a single ${name} (${category}), individual object, no background, transparent background, natural detailed textures, soft studio lighting from top left, subtle contact shadows, vibrant and juicy colors, Octane Render style, 3/4 view, isolated, high quality, ray-tracing.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (error: any) {
    if (error?.error?.code === 429 && retryCount < 3) {
      await new Promise(r => setTimeout(r, 5000 * (retryCount + 1)));
      return generateIndividualIcon(name, category, retryCount + 1);
    }
    console.error(`Error generating icon for ${name}:`, error);
  }
  return "";
};

export const generateOnboardingImage = async (prompt: string, retryCount = 0): Promise<string> => {
  const model = "gemini-2.5-flash-image";
  const finalPrompt = `${prompt} 3D render, high quality, isolated on pure white background, vibrant colors, soft lighting.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: finalPrompt }] }],
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (error: any) {
    const errorCode = error?.error?.code || error?.status;
    if (errorCode === 429 && retryCount < 3) {
      const waitTime = 10000 * (retryCount + 1);
      console.warn(`Rate limit hit for onboarding image, retrying in ${waitTime}ms...`);
      await new Promise(r => setTimeout(r, waitTime));
      return generateOnboardingImage(prompt, retryCount + 1);
    }
    console.error(`Error generating onboarding image:`, error);
  }
  return "";
};
