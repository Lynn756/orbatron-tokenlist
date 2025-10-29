
// scripts/open-trading-standalone.js (ESM, ethers v6)
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();
const req = (k) => (process.env[k] || "").trim();

const ABI = [
  "function openTrading() external",
  "function tradingOpen() view returns (bool)",
  "function owner() view returns (address)" // for a safety check
];

async function main() {
  const RPC   = req("RPC_URL");        // https://mainnet.base.org
  const PK    = req("PRIVATE_KEY");    // deployer/owner
  const TOKEN = req("TOKEN_ADDRESS");  // deployed Pillow token

  if (!RPC)   throw new Error("RPC_URL missing");
  if (!PK)    throw new Error("PRIVATE_KEY missing");
  if (!TOKEN) throw new Error("TOKEN_ADDRESS missing");

  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet   = new ethers.Wallet(PK, provider);
  const token    = new ethers.Contract(TOKEN, ABI, wallet);

  // Safety: network check
  const net = await provider.getNetwork();
  if (net.chainId !== 8453n) {
    console.log(`⚠️ ChainId is ${net.chainId} (expected 8453 for Base).`);
  }

  // Safety: ownership check
  const onChainOwner = await token.owner();
  if (onChainOwner.toLowerCase() !== wallet.address.toLowerCase()) {
    throw new Error(`Not token owner. Token owner is ${onChainOwner}, you are ${wallet.address}`);
  }

  // State check
  const wasOpen = await token.tradingOpen();
  console.log("tradingOpen before:", wasOpen);

  if (!wasOpen) {
    const tx = await token.openTrading();
    console.log("openTrading tx:", tx.hash);
    const r = await tx.wait();
    console.log("✅ Trading opened in block", r.blockNumber);
  } else {
    console.log("ℹ️ Trading already open.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
