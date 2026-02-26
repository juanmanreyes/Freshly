
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function generate(prompt: string) {
  const model = "gemini-2.5-flash-image";
  const finalPrompt = `${prompt} 3D render, high quality, isolated on pure white background, vibrant colors, soft lighting, Octane Render style.`;

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
  return "";
}

async function main() {
  const prompts = [
    "Generate a hyperrealistic 3D illustration of a modern, sleek double-door refrigerator. The fridge should be fully stocked with neatly organized fresh groceries in clear containers, fruits, and vegetables. One of the bottom crisper drawers should have a subtle green glow emanating from the vegetables. Soft studio lighting, Octane Render style, front 3/4 view, pure white background.",
    "Generate a hyperrealistic 3D illustration of a hand holding a modern smartphone. The phone screen displays an open camera app interface, actively scanning a bunch of fresh spinach and a half-cut avocado on a light wooden surface. A clean, minimalist UI overlay with a green scanning box and subtle text 'Spinach - Fresh' and '8 days' should be visible. Soft studio lighting, Octane Render style, eye-level perspective, pure white background.",
    "Generate a hyperrealistic 3D illustration of a simple, elegant bowl of spaghetti with red sauce and fresh basil on top, placed slightly off-center. Around the bowl, various 3D ingredients like a red tomato, basil leaves, orecchiette pasta, and other small pasta shapes should be gently floating. In the background, a modern smartphone is levitating, displaying a recipe app interface with '5 Steps' visible. Soft studio lighting, Octane Render style, slightly elevated perspective, pure white background."
  ];

  const results = [];
  for (let i = 0; i < prompts.length; i++) {
    console.error(`Generating image ${i + 1}...`);
    const img = await generate(prompts[i]);
    results.push(img);
    // Wait to avoid rate limits
    if (i < prompts.length - 1) await new Promise(r => setTimeout(r, 5000));
  }

  console.log(JSON.stringify(results));
}

main().catch(console.error);
