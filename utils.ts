import type { BotState, BotStateStandAlone } from "@builderbot/bot/dist/types";

export type History = { role: "user" | "assistant"; content: string };

const handleHistory = async (
  inside: History,
  _state: BotState | BotStateStandAlone
) => {
  console.log("handle history");
  const history = _state.get<History[]>("history") ?? [];
  history.push(inside);
  await _state.update({ history });
};

const getHistory = (_state: BotState | BotStateStandAlone, k = 6) => {
  const history = _state.get<History[]>("history") ?? [];
  const limitHistory = history.slice(-k);
  return limitHistory;
};

const getHistoryParse = (_state: BotState | BotStateStandAlone, k = 6) => {
  const history = _state.get<History[]>("history") ?? [];

  return history;
};

const clearHistory = async (_state: BotState | BotStateStandAlone) => {
  _state.clear();
};

function generateTimer(min: number, max: number) {
  const numSal = Math.random();

  const numeroAleatorio = Math.floor(numSal * (max - min + 1)) + min;
  return numeroAleatorio;
}

export {
  handleHistory,
  getHistory,
  getHistoryParse,
  clearHistory,
  generateTimer,
};
