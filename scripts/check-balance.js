
// scripts/check-balance.js
import "dotenv/config";
import { ethers } from "ethers";

const req = (k) => (process.env[k] || "").trim();

const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

async function main() {
  const RPC = req("RPC_URL");
  const RAW = req("TOKEN_ADDRESS");
  const TOKEN = ethers.getAddress(RAW); // normalizes checksum

  const provider = new ethers.JsonRpcProvider(RPC);

  // make sure there is code at the address
  const code = await provider.getCode(TOKEN);
  if (code === "0x") throw new Error(`No contract code at ${TOKEN} (check TOKEN_ADDRESS)`);

  const t = new ethers.Contract(TOKEN, ABI, provider);
  const [sym, dec, bal] = await Promise.all([
    t.symbol(),
    t.decimals(),
    t.balanceOf(TOKEN),
  ]);

  console.log("Token:", TOKEN);
  console.log("Symbol:", sym);
  console.log("Contract balance:", ethers.formatUnits(bal, dec), sym);
}

main().catch((e) => (console.error(e), process.exit(1)));
