import { Client } from "@heroiclabs/nakama-js";

// Replace with your Nakama server settings (use env vars in real app)
const NAKAMA_HOST = import.meta.env.VITE_NAKAMA_HOST ?? "127.0.0.1";
const NAKAMA_PORT = import.meta.env.VITE_NAKAMA_PORT ?? "7350";
const NAKAMA_KEY = import.meta.env.VITE_NAKAMA_KEY ?? "defaultkey";
const USE_SSL = (import.meta.env.VITE_NAKAMA_SSL ?? "false") === "true";

//Ticket
const query = "*";
const min_players = 2;
const max_players = 2;

const client = new Client(
  NAKAMA_KEY,
  NAKAMA_HOST,
  Number(NAKAMA_PORT),
  USE_SSL
);

const socket = client.createSocket(USE_SSL, false);

const authenticate = async () => {
  const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID();
  localStorage.setItem("deviceId", deviceId);
  const session = await client.authenticateDevice(deviceId, true);

  return session;
};

const connectSocket = async (session) => {
  await socket.connect(session, true);
  return socket;
};

const findOrCreateMatch = async () => {
  const matchmakerTicket = await socket.addMatchmaker(
    "*",
    min_players,
    max_players
  );
  return matchmakerTicket;
};

const updateUsername = async (session, username) => {
  await client.updateAccount(session, { username });
  const refreshed = await client.sessionRefresh(session);
  localStorage.setItem("username", username);
  return refreshed;
};

export {
  client,
  socket,
  authenticate,
  connectSocket,
  findOrCreateMatch,
  updateUsername,
};
