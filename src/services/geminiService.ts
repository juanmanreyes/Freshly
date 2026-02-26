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
  Use ONLY these categories: Grains, Vegetables, Fruits, Dairy, Proteins.
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

export interface Recipe {
  title: string;
  description: string;
  prepTime: string;
  difficulty: string;
  ingredients: string[];
  steps: string[];
  imageUrl?: string;
}

export const generateRecipe = async (items: FoodItem[]): Promise<Recipe> => {
  const model = "gemini-3-flash-preview";
  const expiringItems = items
    .filter(i => i.status !== 'expired')
    .map(i => `${i.name} (expires in ${Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days)`)
    .join(", ");

  const prompt = `I have these ingredients that are about to expire: ${expiringItems}. 
  Suggest a creative recipe to use them. 
  You must return a JSON object with the following structure:
  {
    "title": "Recipe Name",
    "description": "A brief tempting description",
    "prepTime": "e.g.: 25 minutes",
    "difficulty": "Easy/Medium/Hard",
    "ingredients": ["ingredient 1", "ingredient 2"],
    "steps": ["step 1", "step 2"]
  }
  Respond only with the JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          prepTime: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "description", "prepTime", "difficulty", "ingredients", "steps"]
      }
    }
  });

  const recipe = JSON.parse(response.text || "{}") as Recipe;
  
  // Generate image for the recipe
  try {
    const imageUrl = await generateRecipeImage(recipe.title);
    recipe.imageUrl = imageUrl;
  } catch (e) {
    console.error("Error generating recipe image", e);
  }

  return recipe;
};

export const generateRecipeImage = async (title: string): Promise<string> => {
  const model = "gemini-2.5-flash-image";
  const prompt = `Professional food photography of ${title}, high-end restaurant plating, close-up, soft natural lighting, vibrant colors, bokeh background, 8k resolution, appetizing.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      imageConfig: {
        aspectRatio: "16:9"
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
  return "";
};

export const generateIndividualIcon = async (name: string, category: string, retryCount = 0): Promise<string> => {
  const model = "gemini-2.5-flash-image";
  
  let styleContext = "";
  if (category.toLowerCase().includes('protein') || category.toLowerCase().includes('meat')) {
    styleContext = "professionally plated or on a simple wooden board, high-end food photography style";
  } else if (category.toLowerCase().includes('dairy') || category.toLowerCase().includes('grain')) {
    styleContext = "in a simple elegant ceramic bowl or glass container";
  } else {
    styleContext = "fresh and vibrant, individual object";
  }

  const prompt = `3D hyperrealistic render of ${name} (${category}), ${styleContext}, pure white background, isolated, soft studio lighting, natural detailed textures, vibrant colors, Octane Render style, high quality, 8k resolution.`;

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
