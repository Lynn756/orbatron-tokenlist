require('dotenv').config();
const { ethers } = require('ethers');

const ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function owner() view returns (address)'
];

(async () => {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const token = new ethers.Contract(process.env.TOKEN_ADDRESS, ABI, provider);

  const [nm, sym, dec, ts, owner, bContract, bOwner] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
    token.totalSupply(),
    token.owner().catch(()=> '0x0000000000000000000000000000000000000000'),
    token.balanceOf(process.env.TOKEN_ADDRESS),
    token.balanceOf(new ethers.Wallet(process.env.PRIVATE_KEY).address),
  ]);

  const fmt = (x)=> ethers.formatUnits(x, dec);
  console.log(`Token: ${nm} (${sym})`);
  console.log(`Decimals: ${dec}`);
  console.log(`TotalSupply: ${fmt(ts)} ${sym}`);
  console.log(`Owner(): ${owner}`);
  console.log(`Contract balance: ${fmt(bContract)} ${sym}`);
  console.log(`Owner wallet: ${fmt(bOwner)} ${sym}`);

  // also check common sinks
  const zero = '0x0000000000000000000000000000000000000000';
  const dead = '0x000000000000000000000000000000000000dEaD';
  const [bZero, bDead] = await Promise.all([
    token.balanceOf(zero),
    token.balanceOf(dead),
  ]);
  console.log(`Zero address: ${fmt(bZero)} ${sym}`);
  console.log(`Dead address: ${fmt(bDead)} ${sym}`);
})().catch(e=>{
  console.error('FAILED:', e.shortMessage || e.message || e);
  process.exit(1);
});
