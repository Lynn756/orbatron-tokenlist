
// scripts/add-liquidity-otron.js
import "dotenv/config";
import { ethers } from "ethers";

const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function uniswapV2Pair() view returns (address)"
];

const ROUTER_ABI = [
  "function addLiquidityETH(address token,uint amountTokenDesired,uint amountTokenMin,uint amountETHMin,address to,uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)"
];

// ---------- ENV + validation ----------
const req = (k) => (process.env[k] || "").trim();
const RPC      = req("RPC_URL");
const PK       = req("PRIVATE_KEY");
const TOKEN    = req("TOKEN_ADDRESS");
const ROUTER   = req("ROUTER_ADDRESS") || req("V2_ROUTER"); // allow either key name
const ETH_IN   = req("LIQ_ETH");       // e.g. "1.10"
const TOKENS_IN= req("LIQ_TOKENS");    // wei string, or leave blank to use full balance
const SLIP_BPS = Number(req("SLIPPAGE_BIPS") || "500"); // default 5%

for (const [name, val] of Object.entries({ RPC_URL: RPC, PRIVATE_KEY: PK, TOKEN_ADDRESS: TOKEN, ROUTER_ADDRESS: ROUTER, LIQ_ETH: ETH_IN })) {
  if (!val) throw new Error(`Missing ${name} in .env`);
}

const toAddr = (a) => ethers.getAddress(a);

// ---------- Main ----------
async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet   = new ethers.Wallet(PK, provider);

  const token  = new ethers.Contract(toAddr(TOKEN), TOKEN_ABI, wallet);
  const router = new ethers.Contract(toAddr(ROUTER), ROUTER_ABI, wallet);

  const [decimals, symbol] = await Promise.all([
    token.decimals().catch(() => 18),
    token.symbol().catch(() => "TOKEN")
  ]);

  const me   = await wallet.getAddress();
  const bal  = await token.balanceOf(me);
  const ethDesired = ethers.parseEther(ETH_IN);

  // Decide tokenDesired
  let tokenDesired;
  if (TOKENS_IN && TOKENS_IN !== "0") {
    tokenDesired = ethers.toBigInt(TOKENS_IN);
  } else {
    tokenDesired = bal; // fall back to full balance
  }

  if (tokenDesired === 0n) throw new Error("Token amount to add is 0");
  if (bal < tokenDesired) {
    throw new Error(`Not enough token balance. Have=${bal.toString()} need=${tokenDesired.toString()}`);
  }

  const tokenMin = (tokenDesired * BigInt(10_000 - SLIP_BPS)) / 10_000n;
  const ethMin   = (ethDesired   * BigInt(10_000 - SLIP_BPS)) / 10_000n;

  console.log("\n=== ADD LIQUIDITY - PREVIEW ===");
  console.log("Wallet:        ", me);
  console.log("Token:         ", toAddr(TOKEN), `(${symbol})`);
  console.log("Router:        ", toAddr(ROUTER));
  console.log("ETH desired:   ", ethers.formatEther(ethDesired), "ETH");
  console.log("ETH min:       ", ethers.formatEther(ethMin), "ETH");
  console.log("Token desired: ", ethers.formatUnits(tokenDesired, decimals), symbol);
  console.log("Token min:     ", ethers.formatUnits(tokenMin, decimals), symbol);
  console.log("Slippage (bps):", SLIP_BPS);
  console.log();

  // Approve only what we need, if needed
  const allowance = await token.allowance(me, toAddr(ROUTER));
  if (allowance < tokenDesired) {
    console.log("Approving router for", ethers.formatUnits(tokenDesired, decimals), symbol, "...");
    const txA = await token.approve(toAddr(ROUTER), tokenDesired);
    console.log("approve tx:", txA.hash);
    await txA.wait();
    console.log("Router approved.");
  } else {
    console.log("Sufficient allowance already set.");
  }

  // Add liquidity
  const deadline = Math.floor(Date.now() / 1000) + 60 * 15; // 15 min
  console.log("Adding liquidity...");
  const tx = await router.addLiquidityETH(
    toAddr(TOKEN),
    tokenDesired,
    tokenMin,
    ethMin,
    me,
    deadline,
    { value: ethDesired }
  );

  console.log("addLiquidityETH tx:", tx.hash);
  const rcpt = await tx.wait();
  console.log("Status:", rcpt?.status ? "SUCCESS" : "FAILED");

  // Optional: read pair from token (your contract stores it)
  try {
    const pair = await token.uniswapV2Pair();
    console.log("Pair:", toAddr(pair));
  } catch {
    // ignore if token ABI doesn’t expose it
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nERROR:", err.message || err);
  process.exit(1);
});
