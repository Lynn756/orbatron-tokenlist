
// scripts/add-liquidity-via-token.js
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const req = (k) => (process.env[k] || "").trim();

const TOKEN_ABI = [
  "function approve(address spender, uint256 value) external returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function addLiquidityETH(uint256 tokenAmount,uint256 minTokens,uint256 minETH) external payable"
];

const ROUTER = "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"; // Base mainnet router (lowercase OK)

async function main() {
  const RPC   = req("RPC_URL");
  const PK    = req("PRIVATE_KEY");
  const TOKEN = req("TOKEN_ADDRESS");
  const TOK   = req("LIQ_TOKENS");   // whole tokens
  const ETH   = req("LIQ_ETH");      // ETH amount

  if (!RPC) throw new Error("RPC_URL missing");
  if (!PK) throw new Error("PRIVATE_KEY missing");
  if (!TOKEN) throw new Error("TOKEN_ADDRESS missing");
  if (!TOK) throw new Error("LIQ_TOKENS missing");
  if (!ETH) throw new Error("LIQ_ETH missing");

  const provider = new ethers.JsonRpcProvider(RPC);
  const owner    = new ethers.Wallet(PK, provider);

  const token = new ethers.Contract(TOKEN, TOKEN_ABI, owner);

  const [decimals, symbol, bal] = await Promise.all([
    token.decimals(),
    token.symbol(),
    token.balanceOf(TOKEN)
  ]);

  console.log("Owner     :", owner.address);
  console.log("Token     :", TOKEN, `(${symbol})`);
  console.log("Contract balance:", bal.toString());

  const amountTokenDesired = ethers.parseUnits(TOK, decimals);
  const amountETH = ethers.parseEther(ETH);

  // Call contract’s addLiquidityETH (because it holds the tokens)
  console.log(`Adding liquidity: ${TOK} ${symbol} + ${ETH} ETH…`);
  const tx = await token.addLiquidityETH(
    amountTokenDesired,
    0,
    0,
    { value: amountETH }
  );
  console.log("addLiquidityETH tx:", tx.hash);
  const rcp = await tx.wait();
  console.log("✅ Liquidity added in block", rcp.blockNumber);

  // After LP, open trading
  console.log("Opening trading…");
  const tx2 = await token.openTrading();
  console.log("openTrading tx:", tx2.hash);
  await tx2.wait();
  console.log("✅ Trading opened.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
