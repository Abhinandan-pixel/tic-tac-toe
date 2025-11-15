import { Client } from "@heroiclabs/nakama-js";
import { WebSocketAdapterPb } from "@heroiclabs/nakama-js-protobuf";

// Replace with your Nakama server settings (use env vars in real app)
const NAKAMA_HOST = import.meta.env.VITE_NAKAMA_HOST ?? "127.0.0.1";
const NAKAMA_PORT = import.meta.env.VITE_NAKAMA_PORT ?? "7350";
const NAKAMA_KEY  = import.meta.env.VITE_NAKAMA_KEY ?? "defaultkey";
const USE_SSL     = (import.meta.env.VITE_NAKAMA_SSL ?? "false") === "true";

const client = new Client(NAKAMA_KEY, NAKAMA_HOST, Number(NAKAMA_PORT), USE_SSL);

const socket = client.createSocket(USE_SSL, false, new WebSocketAdapterPb());

export { client, socket };