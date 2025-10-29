
// scripts/lp-balance.js
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC   = process.env.RPC_URL?.trim();
const TOKEN = process.env.TOKEN_ADDRESS?.trim();
const OWNER = process.env.OWNER_ADDRESS || ""; // optional, defaults to PK wallet
const PK    = process.env.PRIVATE_KEY?.trim();

const ROUTER = "0x4752BA5DbC23F44D87826276bF6f6dB61c372aD2";
const ROUTER_ABI = ["function WETH() view returns (address)", "function factory() view returns (address)"];
const FACTORY_ABI = ["function getPair(address,address) view returns (address)"];
const ERC20_ABI   = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];

if (!RPC) throw new Error("RPC_URL missing");
if (!TOKEN) throw new Error("TOKEN_ADDRESS missing");
if (!PK && !OWNER) throw new Error("Either PRIVATE_KEY or OWNER_ADDRESS required");

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = PK ? new ethers.Wallet(PK, provider) : null;
  const who = OWNER || (wallet ? wallet.address : null);

  const router = new ethers.Contract(ROUTER, ROUTER_ABI, provider);
  const weth   = await router.WETH();
  const fact   = await router.factory();
  const factory = new ethers.Contract(fact, FACTORY_ABI, provider);
  const pair   = await factory.getPair(TOKEN, weth);
  if (pair === ethers.ZeroAddress) {
    console.log("Pair not created yet.");
    return;
  }
  const lp = new ethers.Contract(pair, ERC20_ABI, provider);
  const bal = await lp.balanceOf(who);
  const dec = await lp.decimals();
  console.log(`LP balance for ${who}:`, Number(bal) / 10**dec);
  console.log(`LP token (pair) address: ${pair}`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
