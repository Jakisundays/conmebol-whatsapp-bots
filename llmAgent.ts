import Anthropic from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources/messages";

class LLMAgent {
  private anthropic: Anthropic;
  private model: string;
  private max_tokens: number;
  private systemInstruction: string;
  constructor({
    apiKey,
    model,
    max_tokens,
    systemInstruction,
  }: {
    apiKey: string;
    model: string;
    max_tokens: number;
    systemInstruction: string;
  }) {
    this.anthropic = new Anthropic({
      apiKey,
    });
    this.model = model;
    this.max_tokens = max_tokens;
    this.systemInstruction = systemInstruction;
  }
  async generate({ prompt, history }: { prompt: string; history: any[] }) {
    const updatedHistory = history.slice(0, -1).map((item) => ({
      role: item.role == "user" ? "user" : "assistant",
      content: item.content as string,
    }));

    updatedHistory.push({ role: "user", content: prompt });

    const msg = await this.anthropic.messages.create({
      model: this.model,
      system: this.systemInstruction,
      max_tokens: this.max_tokens,
      messages: updatedHistory as MessageParam[],
    });

    return msg;
  }
}

export default LLMAgent;
