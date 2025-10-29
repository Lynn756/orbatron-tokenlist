
// scripts/inspect.js
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

// ---- ENV / Defaults for BASE ----
const RPC_URL = process.env.BASE_RPC_URL || process.env.RPC_URL;
const TOKEN   = process.env.TOKEN_ADDRESS;

const DEFAULT_V2_ROUTER_BASE  = "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"; // Base v2 router
const ROUTER = process.env.UNISWAP_ROUTER || DEFAULT_V2_ROUTER_BASE;

if (!RPC_URL || !TOKEN) {
  throw new Error("Missing BASE_RPC_URL (or RPC_URL) or TOKEN_ADDRESS in .env");
}

const ROUTER_ABI  = [
  "function factory() view returns (address)",
  "function WETH() view returns (address)"
];
const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) view returns (address)"
];
const PAIR_ABI    = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  const router = new ethers.Contract(ROUTER, ROUTER_ABI, provider);
  const factoryAddr = await router.factory();
  const weth        = await router.WETH();

  const factory = new ethers.Contract(factoryAddr, FACTORY_ABI, provider);
  const pairAddr = await factory.getPair(TOKEN, weth);

  console.log("Router:", ROUTER);
  console.log("Pair:", pairAddr);

  if (pairAddr && pairAddr !== ethers.ZeroAddress) {
    const pair = new ethers.Contract(pairAddr, PAIR_ABI, provider);
    const [r0, r1] = await pair.getReserves();
    console.log("Reserves:", r0.toString(), r1.toString());
  } else {
    console.log("Reserves:", "(no pair)");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
