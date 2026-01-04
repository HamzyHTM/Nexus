
import { GoogleGenAI } from "@google/genai";

export const getAIResponse = async (prompt: string, history: { role: string; text: string }[]) => {
  try {
    // ALWAYS initialize the client with process.env.API_KEY directly in the configuration object.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Map history roles to 'user' or 'model' as required by the Gemini API.
    const formattedHistory = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    // Call generateContent directly with both the model and the conversation parts.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: "You are Alex, a helpful and friendly chat assistant. Keep responses concise, conversational, and use emojis where appropriate. You are chatting in a messaging app interface.",
        temperature: 0.7,
      },
    });

    // Access the .text property directly on the response object.
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to my neural net right now. 🤖";
  }
};
