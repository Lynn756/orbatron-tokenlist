
// scripts/check-router.js
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC   = process.env.RPC_URL?.trim();
const TOKEN = process.env.TOKEN_ADDRESS?.trim();
const ROUTER = "0x4752BA5DbC23F44D87826276bF6f6dB61c372aD2";

if (!RPC) throw new Error("RPC_URL missing");
if (!TOKEN) throw new Error("TOKEN_ADDRESS missing");

const ROUTER_ABI = [
  "function WETH() view returns (address)",
  "function factory() view returns (address)"
];

const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, provider);
  const weth = await router.WETH();
  const factory = await router.factory();
  console.log("WETH:", weth);
  console.log("Factory:", factory);

  const f = new ethers.Contract(factory, FACTORY_ABI, provider);
  const pair = await f.getPair(TOKEN, weth);
  console.log("Pair:", pair === ethers.ZeroAddress ? "not created yet" : pair);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
