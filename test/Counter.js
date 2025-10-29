
// pillow-liquidity.js
import 'dotenv/config';
import { ethers } from 'ethers';

// --- Minimal ABI for your Pillow token wrapper ---
const TOKEN_ABI = [
  'function addLiquidityETH(uint256 tokenAmount, uint256 minTokens, uint256 minETH) external payable',
  'function openTrading() external',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

const req = (k, d = '') => (process.env[k] ?? d).trim();

function bpsDown(amountBigInt, bps) {
  return amountBigInt - (amountBigInt * BigInt(bps)) / 10000n;
}

async function main() {
  const RPC         = req('RPC_URL');
  const PK          = req('PRIVATE_KEY');
  const TOKEN_ADDR  = ethers.getAddress(req('TOKEN_ADDRESS'));
  const LIQ_ETH_S   = req('LIQ_ETH', '0.02');
  const LIQ_TOK_S   = req('LIQ_TOKENS', '100000');
  const SLIPPAGE    = parseInt(req('SLIPPAGE_BPS', '300'), 10);

  if (!RPC || !PK || !TOKEN_ADDR) {
    throw new Error('Missing RPC_URL, PRIVATE_KEY, or TOKEN_ADDRESS in .env');
  }

  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet   = new ethers.Wallet(PK, provider);
  const token    = new ethers.Contract(TOKEN_ADDR, TOKEN_ABI, wallet);

  const [dec, sym] = await Promise.all([token.decimals(), token.symbol()]);

  const amtTokens = ethers.parseUnits(LIQ_TOK_S, dec);
  const amtETH    = ethers.parseEther(LIQ_ETH_S);

  const minTokens = bpsDown(amtTokens, SLIPPAGE);
  const minETH    = bpsDown(amtETH, SLIPPAGE);

  console.log(`\nPillow: ${TOKEN_ADDR}`);
  console.log(`Symbol: ${sym}, Decimals: ${dec}`);
  console.log(`Owner : ${wallet.address}`);
  console.log(`\nDesired Liquidity: ${LIQ_ETH_S} ETH + ${LIQ_TOK_S} ${sym}`);
  console.log(`Min (slippage ${SLIPPAGE} bps): ${ethers.formatEther(minETH)} ETH + ${ethers.formatUnits(minTokens, dec)} ${sym}`);

  // Balances
  const [ethBal, cBal, wBal] = await Promise.all([
    provider.getBalance(wallet.address),
    token.balanceOf(TOKEN_ADDR),    // tokens held by the CONTRACT
    token.balanceOf(wallet.address) // tokens held by the OWNER
  ]);

  console.log(`\nBalances:`);
  console.log(`  Owner ETH        : ${ethers.formatEther(ethBal)} ETH`);
  console.log(`  Contract ${sym}  : ${ethers.formatUnits(cBal, dec)} ${sym}`);
  console.log(`  Owner ${sym}     : ${ethers.formatUnits(wBal, dec)} ${sym}`);

  if (ethBal < amtETH) {
    throw new Error(`Not enough ETH in owner wallet to provide ${LIQ_ETH_S} + gas.`);
  }

  // This flow assumes your token’s addLiquidityETH() uses tokens HELD BY THE CONTRACT.
  if (cBal < amtTokens) {
    console.error(`\n❌ The CONTRACT does not have enough ${sym} to supply ${LIQ_TOK_S}.`);
    console.error(`   If your supply is in the owner wallet, run the transfer script below first to move tokens into the CONTRACT, then re-run this script.`);
    console.error(`   (See "Phase 2 — If tokens are in your wallet" in this message.)`);
    process.exit(1);
  }

  console.log(`\nAdding liquidity via token.addLiquidityETH(...) ...`);
  const tx1 = await token.addLiquidityETH(amtTokens, minTokens, minETH, { value: amtETH });
  console.log(`  addLiquidityETH tx: ${tx1.hash}`);
  const rc1 = await tx1.wait();
  console.log(`  ✅ Confirmed in block ${rc1.blockNumber}`);

  try {
    console.log(`\nOpening trading via token.openTrading() ...`);
    const tx2 = await token.openTrading();
    console.log(`  openTrading tx: ${tx2.hash}`);
    const rc2 = await tx2.wait();
    console.log(`  ✅ Trading opened (block ${rc2.blockNumber})`);
  } catch (err) {
    console.warn(`  ⚠️ openTrading() reverted or already open. Details: ${err?.shortMessage || err?.message || err}`);
  }

  console.log(`\nDONE — Liquidity added. Try swapping with the token address: ${TOKEN_ADDR}\n`);
}

main().catch((e) => {
  console.error('\nFAILED:', e?.shortMessage || e?.message || e);
  process.exit(1);
});
