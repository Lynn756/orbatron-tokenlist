
// scripts/verify.js
require("dotenv").config();
const hre = require("hardhat");
const { getAddress, JsonRpcProvider } = require("ethers");

async function main() {
  // 1) Read and normalize the address (throws if invalid or has hidden chars)
  if (!process.env.TOKEN_ADDRESS) throw new Error("Missing TOKEN_ADDRESS in .env");
  const ADDRESS = getAddress(process.env.TOKEN_ADDRESS); // checksum & validate

  // Optional: prove there's contract bytecode at this address on Base
  const provider = new JsonRpcProvider(process.env.RPC_URL || "https://mainnet.base.org");
  const code = await provider.getCode(ADDRESS);
  if (code === "0x") {
    throw new Error(`No contract code at ${ADDRESS} on Base. (Wrong address/network?)`);
  }

  console.log("Network:", hre.network.name);
  console.log("Address:", ADDRESS);
  console.log("Bytecode prefix:", code.slice(0, 10));

  // 2) Your contract has NO constructor args
  const ARGS = [];

  // 3) Verify (explicitly specify the contract path:name to avoid ambiguity)
  await hre.run("verify:verify", {
    address: ADDRESS,
    constructorArguments: ARGS,
    contract: "contracts/OrbatronToken.sol:OrbatronToken",
  });

  console.log("✅ Submitted to BaseScan/Etherscan for verification.");
}

main().catch((e) => {
  console.error("❌ Verification failed:", e.message || e);
  process.exit(1);
});
