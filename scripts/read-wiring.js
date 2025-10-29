// scripts/read-wiring.js
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.BASE_RPC_URL || process.env.RPC_URL;
const TOKEN   = process.env.TOKEN_ADDRESS;

if (!RPC_URL || !TOKEN) {
  throw new Error("Missing BASE_RPC_URL (or RPC_URL) or TOKEN_ADDRESS in .env");
}

// Base Uniswap v2 defaults (used if token doesn't expose them)
const DEFAULT_V2_ROUTER_BASE  = "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24";
const DEFAULT_V2_FACTORY_BASE = "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6";

const provider = new ethers.JsonRpcProvider(RPC_URL);

const GENERIC_TOKEN_ABI = [
  "function router() view returns (address)",
  "function uniswapRouter() view returns (address)",
  "function uniswapV2Router() view returns (address)",
  "function UNISWAP_ROUTER() view returns (address)",

  "function factory() view returns (address)",
  "function uniswapFactory() view returns (address)",
  "function uniswapV2Factory() view returns (address)",
  "function UNISWAP_FACTORY() view returns (address)",

  "function pair() view returns (address)",
  "function uniswapPair() view returns (address)",
  "function uniswapV2Pair() view returns (address)",
  "function UNISWAP_PAIR() view returns (address)",

  "function WETH() view returns (address)",
  "function weth() view returns (address)",
];

const ROUTER_ABI  = ["function factory() view returns (address)", "function WETH() view returns (address)"];
const FACTORY_ABI = ["function getPair(address,address) view returns (address)"];
const PAIR_ABI    = [
  "function getReserves() view returns (uint112,uint112,uint32)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
];

async function tryFns(c, names) {
  for (const n of names) {
    try { if (typeof c[n] === "function") {
      const v = await c[n]();
      if (v && v !== ethers.ZeroAddress) return v;
    }} catch {}
  }
  return null;
}

async function main() {
  const token = new ethers.Contract(TOKEN, GENERIC_TOKEN_ABI, provider);

  // Router
  let router = await tryFns(token, ["router","uniswapRouter","uniswapV2Router","UNISWAP_ROUTER"]);
  if (!router) router = DEFAULT_V2_ROUTER_BASE;

  // Factory & WETH
  let factory = await tryFns(token, ["factory","uniswapFactory","uniswapV2Factory","UNISWAP_FACTORY"]);
  if (!factory) {
    try { factory = await new ethers.Contract(router, ROUTER_ABI, provider).factory(); }
    catch { factory = DEFAULT_V2_FACTORY_BASE; }
  }

  let weth;
  try { weth = await new ethers.Contract(router, ROUTER_ABI, provider).WETH(); } catch {}

  // Pair
  let pair = await tryFns(token, ["pair","uniswapPair","uniswapV2Pair","UNISWAP_PAIR"]);
  if (!pair && factory && weth) {
    try { pair = await new ethers.Contract(factory, FACTORY_ABI, provider).getPair(TOKEN, weth); }
    catch {}
  }

  // Print exactly what you asked for
  if (router) console.log("Router:", router);
  if (pair)   console.log("Pair:", pair);

  if (pair && pair !== ethers.ZeroAddress) {
    const pairC = new ethers.Contract(pair, PAIR_ABI, provider);
    try {
      const [r0, r1] = await pairC.getReserves();
      console.log("Reserves:", r0.toString(), r1.toString());
    } catch {
      console.log("Reserves:", "(error reading reserves)");
    }
  } else {
    console.log("Reserves:", "(no pair)");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
