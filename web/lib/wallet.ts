"use client";

import {
  createPasskeyWithPrfOutput,
  createSecp256k1SigningSession,
  deriveEvmPrivateKey,
  getPasskeyPrfOutput,
  MeraError,
} from "@category-labs/mera";
import { toViemAccount } from "@category-labs/mera/viem";
import { createWalletClient, http, type LocalAccount, type WalletClient } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { chain, clientRpcUrl } from "./config";

export type WalletMode = "passkey" | "browser-key";
export type PlayerWallet = { account: LocalAccount; client: WalletClient; mode: WalletMode };

const CRED_KEY = "overcall.credentialId";
const FALLBACK_KEY = "overcall.fallbackKey";

let cached: PlayerWallet | null = null;

function store(key: string, value?: string) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {
    // private mode or blocked storage: the wallet then lives only for this tab
  }
  return null;
}

function wrap(account: LocalAccount, mode: WalletMode): PlayerWallet {
  const client = createWalletClient({ account, chain, transport: http(clientRpcUrl()) });
  cached = { account, client, mode };
  return cached;
}

function browserKeyWallet(): PlayerWallet {
  let key = store(FALLBACK_KEY) as `0x${string}` | null;
  if (!key) {
    key = generatePrivateKey();
    store(FALLBACK_KEY, key);
  }
  return wrap(privateKeyToAccount(key), "browser-key");
}

/** Passkey wallet via Mera when the device supports PRF, else a key kept in this browser. */
export async function getWallet(displayName: string): Promise<PlayerWallet> {
  if (cached) return cached;
  const passkeysPossible =
    typeof window !== "undefined" && window.isSecureContext && "PublicKeyCredential" in window;
  if (!passkeysPossible) return browserKeyWallet();

  try {
    const rpId = window.location.hostname;
    const saved = store(CRED_KEY);
    let prfOutput: Uint8Array;
    if (saved) {
      ({ prfOutput } = await getPasskeyPrfOutput({ rpId, credential: { credentialId: saved } }));
    } else {
      const created = await createPasskeyWithPrfOutput({
        rp: { id: rpId, name: "Over Call" },
        user: { name: displayName, displayName },
      });
      store(CRED_KEY, created.credentialId);
      prfOutput = created.prfOutput;
    }
    const session = createSecp256k1SigningSession({
      privateKey: deriveEvmPrivateKey({ prfOutput, accountIndex: 0 }),
    });
    return wrap(toViemAccount(session), "passkey");
  } catch (e) {
    if (e instanceof MeraError && e.code === "PASSKEY_CANCELLED") throw e;
    console.warn("[overcall] passkey unavailable, using a browser key", e);
    return browserKeyWallet();
  }
}
