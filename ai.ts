import { GoogleGenAI } from "@google/genai";

class Bot {
  private genAI: GoogleGenAI;
  private model: string = "gemini-2.5-flash";
  private systemInstruction: string;
  constructor({
    apiKey,
    model,
    systemInstruction,
  }: {
    apiKey: string;
    model: string;
    systemInstruction: string;
  }) {
    this.genAI = new GoogleGenAI({
      apiKey,
    });
    this.model = model;
    this.systemInstruction = systemInstruction;
  }

  async generate({ prompt, history }: { prompt: string; history: any[] }) {
    const updatedHistory = history.slice(0, -1).map((item) => ({
      role: item.role == "user" ? "user" : "model",
      parts: [{ text: item.content }],
    }));

    const chat = this.genAI.chats.create({
      model: this.model,
      history: updatedHistory,
      config: {
        systemInstruction: this.systemInstruction,
      },
    });

    const response = await chat.sendMessage({
      message: prompt,
    });

    return response;
  }
}

export default Bot;
