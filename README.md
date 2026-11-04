# Over Call

**The whole room calls the next ball of a cricket over from their phones, and every call lands on Monad in real time.**

- **Live app:** https://over-call.vercel.app (big screen: `/screen`, phones: `/play`)
- **Contract (OverCall):** [`0xbbba7dd4695f7fe31a2a616ff2382ebe30a4139e`](https://testnet.monadexplorer.com/address/0xbbba7dd4695f7fe31a2a616ff2382ebe30a4139e), source verified (Sourcify)
- **Network:** Monad Testnet (chain id 10143)

## How it plays

1. The projector shows `/screen` with a QR code. Everyone scans it and opens `/play` on their phone.
2. Each phone gets a passkey-backed key (or a browser key) and gas from the host, so players need no wallet or MON.
3. Before each ball, players call it: Dot, 1–3 runs, Boundary or Wicket. Each call is a transaction on Monad.
4. The host reveals the ball. The contract scores every call, and the big screen shows calls per block and a live leaderboard.

It's points only, no money. Monad's ~400 ms blocks and parallel execution mean a whole room's calls settle in the few seconds before the ball is bowled.

## Layout

- `chain/`: Hardhat project, with `contracts/OverCall.sol`, tests, `scripts/deploy.ts` and `scripts/simulate.ts`
- `web/`: Next.js app, with `/play` (phone), `/screen` (projector), `/host` (host controls), `/api/fund` and `/api/host`
- `web/data/match.json`: the over being replayed (made-up sample data)

## Run it yourself

Requirements: Node 20+.

```bash
# 1. local chain
cd chain && npm install && npx hardhat node

# 2. deploy (writes web/lib/generated/*), then the app
cd chain && npx hardhat run scripts/deploy.ts --network localhost
cd ../web && npm install && npm run dev
```

Open http://localhost:3000/screen on the big screen, http://localhost:3000/play on a phone, and
http://localhost:3000/host?secret=practice to run the over.

### On Monad testnet

1. Make a test-only key and fund it from the Monad testnet faucet.
2. `cd chain && HOST_PRIVATE_KEY=0x… npx hardhat run scripts/deploy.ts --network monadTestnet`
3. In `web/.env.local`, set `NEXT_PUBLIC_CHAIN_ID=10143`, `NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz`,
   `NEXT_PUBLIC_CONTRACT=<deployed address>`, `HOST_PRIVATE_KEY` and `HOST_SECRET`.
4. `cd web && npm run build && npm start`

Checks: `cd chain && npx hardhat test` (contract rules) and
`npx hardhat run scripts/simulate.ts --network localhost` (30 players, 12 balls, leaderboard check).

Built for Monad Blitz Mumbai (Devcon Edition), 4 Nov 2026.
