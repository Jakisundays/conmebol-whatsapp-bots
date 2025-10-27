import {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
  EVENTS,
} from "@builderbot/bot";
import { MemoryDB as Database } from "@builderbot/bot";
import { BaileysProvider as Provider } from "@builderbot/provider-baileys";
import * as dotenv from "dotenv";
import LLMAgent from "llmAgent";
import systemPrompt from "systemPrompt";
import { generateTimer, getHistoryParse, handleHistory } from "utils";

dotenv.config();

const PORT = process.env.PORT ?? 3050;

const bot = new LLMAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-haiku-4-5",
  max_tokens: 1024,
  systemInstruction: systemPrompt,
});

const flow = addKeyword<Provider, Database>(EVENTS.WELCOME)
  .addAction(async ({ body }, { state }) => {
    await handleHistory({ content: body, role: "user" }, state);
  })
  .addAction(async (_, { state, flowDynamic, extensions: bot }) => {
    try {
      const history = getHistoryParse(state);
      const lastMessage = history.at(-1) ?? null;
      if (!lastMessage) {
        return await flowDynamic([
          {
            body: "Lo siento, parece que algo se dañó en el sistema. ¿Podrías intentar de nuevo?",
            delay: generateTimer(100, 200),
          },
        ]);
      }
      const response = await bot.generate({
        prompt: lastMessage.content,
        history,
      });

      await handleHistory(
        { content: response.content[0].text, role: "assistant" },
        state
      );

      await flowDynamic([
        {
          body: response.content[0].text,
          delay: generateTimer(300, 500),
        },
      ]);
    } catch (error) {
      console.error("Error en la generación de respuesta del bot:", error);
      await flowDynamic([
        {
          body: "Lo siento, ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.",
          delay: generateTimer(100, 200),
        },
      ]);
    }
  });

const main = async () => {
  const adapterFlow = createFlow([flow]);
  type IProvider = typeof Provider;
  const adapterProvider = createProvider(Provider, {
    version: [2, 3000, 1025190524] as any,
  });
  const adapterDB = new Database();

  const { handleCtx, httpServer } = await createBot(
    {
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB,
    },
    { extensions: bot }
  );

  adapterProvider.server.post(
    "/v1/messages",
    handleCtx(async (bot, req, res) => {
      const { number, message, urlMedia } = req.body;
      await bot.sendMessage(number, message, { media: urlMedia ?? null });
      return res.end("sended");
    })
  );

  adapterProvider.server.post(
    "/v1/register",
    handleCtx(async (bot, req, res) => {
      const { number, name } = req.body;
      await bot.dispatch("REGISTER_FLOW", { from: number, name });
      return res.end("trigger");
    })
  );

  adapterProvider.server.post(
    "/v1/samples",
    handleCtx(async (bot, req, res) => {
      const { number, name } = req.body;
      await bot.dispatch("SAMPLES", { from: number, name });
      return res.end("trigger");
    })
  );

  adapterProvider.server.post(
    "/v1/blacklist",
    handleCtx(async (bot, req, res) => {
      const { number, intent } = req.body;
      if (intent === "remove") bot.blacklist.remove(number);
      if (intent === "add") bot.blacklist.add(number);

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "ok", number, intent }));
    })
  );

  httpServer(+PORT);
};

main();
