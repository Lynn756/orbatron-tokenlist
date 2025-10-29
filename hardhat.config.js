
import "dotenv/config";
import "@nomicfoundation/hardhat-toolbox";

const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    base: {
      url: process.env.RPC_URL || "https://mainnet.base.org",
      chainId: 8453,
      accounts: [process.env.PRIVATE_KEY].filter(Boolean),
    },
  },
  etherscan: {
    // ✅ v2 format — just one API key for all networks
    apiKey: process.env.BASESCAN_API_KEY,
  },
};

export default config;
