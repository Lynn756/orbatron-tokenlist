import "dotenv/config";
import { ethers } from "ethers";

const RPC = process.env.RPC_URL || "https://mainnet.base.org";
const RAW = process.env.TOKEN_ADDRESS || ""; // any casing is fine

if (!RAW) {
  console.error("Set TOKEN_ADDRESS in .env (or inline) to check.");
  process.exit(1);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const addr = ethers.getAddress(RAW); // auto-checksum
  const net = await provider.getNetwork();
  const code = await provider.getCode(addr);
  console.log("Network chainId:", Number(net.chainId)); // should be 8453
  console.log("Address (checksum):", addr);
  console.log("Has bytecode:", code !== "0x", "length:", code.length);
}
main().catch(console.error);
