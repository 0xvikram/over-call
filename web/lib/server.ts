import "server-only";
import { createWalletClient, http } from "viem";
import { nonceManager, privateKeyToAccount } from "viem/accounts";
import { chain, RPC_URL } from "./config";

// Hardhat's well-known account #0: fine for the local chain only.
const LOCAL_HOST_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const key = (process.env.HOST_PRIVATE_KEY ?? (chain.id === 31337 ? LOCAL_HOST_KEY : undefined)) as
  | `0x${string}`
  | undefined;

export const hostAccount = key ? privateKeyToAccount(key, { nonceManager }) : null;

export const hostClient = hostAccount
  ? createWalletClient({ account: hostAccount, chain, transport: http(RPC_URL) })
  : null;

export const HOST_SECRET = process.env.HOST_SECRET ?? "practice";
