import "@nomicfoundation/hardhat-viem";
import type { HardhatUserConfig } from "hardhat/config";

const HOST_KEY = process.env.HOST_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "prague" },
  },
  networks: {
    hardhat: { chainId: 31337 },
    localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
    monadTestnet: {
      url: process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts: HOST_KEY ? [HOST_KEY] : [],
    },
  },
};

export default config;
