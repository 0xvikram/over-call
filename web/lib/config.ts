import { defineChain, type Address } from "viem";
import local from "./generated/deployment.31337.json";

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337);
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";
export const CONTRACT = (process.env.NEXT_PUBLIC_CONTRACT ?? local.address) as Address;
/** Browsers (phones included) go through the app's /api/rpc; the server talks to the chain directly. */
export const clientRpcUrl = () =>
  typeof window === "undefined" ? RPC_URL : `${window.location.origin}/api/rpc`;
export const CALL_WINDOW_SECONDS = Number(process.env.NEXT_PUBLIC_CALL_WINDOW ?? 8);

export const chain = defineChain({
  id: CHAIN_ID,
  name: CHAIN_ID === 10143 ? "Monad Testnet" : "Local",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
});

export const PICKS = [
  { id: 1, label: "Dot", emoji: "•" },
  { id: 2, label: "1–3 runs", emoji: "🏃" },
  { id: 3, label: "Boundary", emoji: "4|6" },
  { id: 4, label: "Wicket", emoji: "☝️" },
] as const;

export const pickLabel = (id: number) => PICKS.find((p) => p.id === id)?.label ?? "—";
