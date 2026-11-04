import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http, parseEther } from "viem";
import { hardhat } from "viem/chains";

// Plays the sample match with N simulated phones on the local node and checks
// the on-chain leaderboard against scores computed here.
const N = Number(process.env.PLAYERS ?? 30);

async function main() {
  const chainId = 31337;
  const dep = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, `../../web/lib/generated/deployment.${chainId}.json`), "utf8"),
  );
  const match = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../web/data/match.json"), "utf8"));
  const publicClient = await hre.viem.getPublicClient();
  const [, funder] = await hre.viem.getWalletClients();
  const game = await hre.viem.getContractAt("OverCall", dep.address); // host = account 0

  const players = Array.from({ length: N }, (_, i) => {
    const account = privateKeyToAccount(generatePrivateKey());
    const wallet = createWalletClient({ account, chain: hardhat, transport: http("http://127.0.0.1:8545") });
    return { name: `Fan${i + 1}`, account, wallet, points: 0, streak: 0 };
  });

  for (const p of players) {
    await funder.sendTransaction({ to: p.account.address, value: parseEther("0.05") });
  }
  await Promise.all(
    players.map((p) =>
      p.wallet.writeContract({ address: dep.address, abi: game.abi, functionName: "join", args: [p.name] }),
    ),
  );

  const startBlock = await publicClient.getBlockNumber();
  for (const ball of match.balls) {
    await game.write.openBall([3600n]);
    const picks = players.map(() => 1 + Math.floor(Math.random() * 4));
    const hashes = await Promise.all(
      players.map((p, i) =>
        p.wallet.writeContract({ address: dep.address, abi: game.abi, functionName: "call", args: [picks[i]] }),
      ),
    );
    await Promise.all(hashes.map((hash) => publicClient.waitForTransactionReceipt({ hash })));
    await game.write.settle([ball.result]);
    players.forEach((p, i) => {
      if (picks[i] === ball.result) {
        p.points += 10 + Math.min(p.streak, 4) * 5;
        p.streak += 1;
      } else p.streak = 0;
    });
  }

  const logs = await publicClient.getContractEvents({
    address: dep.address,
    abi: game.abi,
    eventName: "Called",
    fromBlock: startBlock,
  });
  const [addrs, , pts] = await game.read.board();
  const onchain = new Map(addrs.map((a, i) => [a.toLowerCase(), pts[i]]));
  const mismatches = players.filter((p) => onchain.get(p.account.address.toLowerCase()) !== BigInt(p.points));

  const top = [...players].sort((a, b) => b.points - a.points).slice(0, 5);
  console.log(`players=${N} balls=${match.balls.length} calls=${logs.length}`);
  console.log("top 5:", top.map((p) => `${p.name}:${p.points}`).join("  "));
  console.log(mismatches.length === 0 ? "LEADERBOARD OK: on-chain matches expected" : `MISMATCH for ${mismatches.length} players`);
  if (mismatches.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
