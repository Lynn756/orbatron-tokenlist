
// scripts/check-env.js
require("dotenv").config();
const hre = require("hardhat");

(async () => {
  console.log("cwd:", process.cwd());
  console.log("network:", hre.network.name);
  console.log("ENV:");
  console.log("  RPC_URL            =", process.env.RPC_URL || "(missing)");
  console.log("  PRIVATE_KEY set?   =", !!process.env.PRIVATE_KEY);
  console.log("  ETHERSCAN_API_KEY? =", !!process.env.ETHERSCAN_API_KEY);

  console.log("\nHardhat config:");
  console.log("  etherscan.apiKey   =", hre.config.etherscan.apiKey);
  console.log("  networks.base.url  =", hre.config.networks.base?.url);
})();
