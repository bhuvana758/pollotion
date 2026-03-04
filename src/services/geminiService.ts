import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function detectEmergencyVehicle(base64Image: string, mimeType: string): Promise<boolean> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: "Does this image contain an ambulance, a police car, or a fire truck? Answer with a JSON object: { \"detected\": true/false, \"vehicleType\": \"ambulance\" | \"police car\" | \"fire truck\" | \"none\" }",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected: { type: Type.BOOLEAN },
            vehicleType: { type: Type.STRING },
          },
          required: ["detected", "vehicleType"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return !!result.detected;
  } catch (error) {
    console.error("Error detecting vehicle:", error);
    return false;
  }
}

export async function generateBenefitsPoster(): Promise<string | null> {
  try {
    const prompt = `Create a modern traffic management awareness poster. 
Show a large green traffic signal light glowing brightly with a white emergency symbol inside the green light. 
Background should look like a smart city road intersection at night. 
Add clean infographic-style text on the right side with bullet points:
- Reduces Noise Pollution
- Reduces Waiting Time
- Reduces Fuel Usage
- Lowers Emission of Gases
Use professional, futuristic design style. 
High resolution, clean layout, vibrant green color emphasis, minimalistic government campaign style.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating poster:", error);
    return null;
  }
}
