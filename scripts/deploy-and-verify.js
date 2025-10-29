
// scripts/deploy-and-verify.js
require("dotenv").config();
const hre = require("hardhat");
const { JsonRpcProvider } = require("ethers");

async function main() {
  console.log("Deployer:", (await hre.ethers.getSigners())[0].address);
  const Orbatron = await hre.ethers.getContractFactory("OrbatronToken");
  const contract = await Orbatron.deploy();                   // deploy
  const tx = contract.deploymentTransaction();                // v6
  console.log("Deploy tx:", tx.hash);
  await contract.waitForDeployment();                         // wait mined
  const addr = await contract.getAddress();
  console.log("Deployed at:", addr);

  // sanity: ensure code exists
  const p = new JsonRpcProvider(process.env.RPC_URL || "https://mainnet.base.org");
  const code = await p.getCode(addr);
  console.log("Bytecode length:", code.length);
  if (code === "0x") throw new Error("No bytecode after deploy; check funds/gas/network.");

  // verify (no constructor args)
  await hre.run("verify:verify", { address: addr, constructorArguments: [] });
  console.log("✅ Verified on BaseScan");
}

main().catch(e => { console.error("❌", e.message || e); process.exit(1); });
