// scripts/find-contract.js
require("dotenv").config();
const { JsonRpcProvider, Wallet } = require("ethers");
const https = require("https");

const RPC = process.env.RPC_URL || "https://mainnet.base.org";
const provider = new JsonRpcProvider(RPC);
const deployer = new Wallet(process.env.PRIVATE_KEY).address;
const API = "https://api.basescan.org/api";

const getJSON = url => new Promise((res, rej) => {
  https.get(url, r => { let d=""; r.on("data", x => d+=x); r.on("end", () => {
    try { res(JSON.parse(d)); } catch(e){ rej(e); }
  });}).on("error", rej);
});

(async () => {
  if (!process.env.ETHERSCAN_API_KEY) throw new Error("Missing ETHERSCAN_API_KEY in .env");
  console.log("Deployer:", deployer);

  // newest first
  const url = `${API}?module=account&action=txlist&address=${deployer}&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`;
  const resp = await getJSON(url);
  if (resp.status !== "1") throw new Error("No txs found for this deployer on Base.");

  // contract creations have empty 'to'
  const creations = resp.result.filter(tx => !tx.to || tx.to === "0x0000000000000000000000000000000000000000");
  if (!creations.length) throw new Error("No contract-creation txs found on Base for this deployer.");

  const tx = creations[0];
  console.log("Latest creation tx:", tx.hash);

  const r = await provider.getTransactionReceipt(tx.hash);
  if (!r || !r.contractAddress) throw new Error("Creation tx has no contractAddress (maybe failed or still pending).");

  console.log("✅ Deployed contract address:", r.contractAddress);
  console.log(`Run: npx hardhat verify --network base ${r.contractAddress}`);
})();
