
// scripts/deploy-otron.js
const hre = require("hardhat");
const { ethers, run } = hre;

const explorer = (addr) => `https://basescan.org/address/${addr}`;

async function main() {
  // Show where we are and who we are (safety)
  const [signer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  console.log("Network chainId:", Number(net.chainId));
  console.log("Deployer:", await signer.getAddress());

  // 1) Deploy (no constructor args)
  console.log("🚀 Deploying OrbatronToken...");
  const Factory = await ethers.getContractFactory("OrbatronToken");
  const token = await Factory.deploy();
  const deployTx = await token.deploymentTransaction();
  console.log("TX hash:", deployTx?.hash ?? "(unknown)");

  await token.waitForDeployment();
  const addr = await token.getAddress();
  console.log("✅ Deployed at:", addr);
  console.log("Explorer:", explorer(addr));

  // 2) Verify (optional but recommended)
  // If this throws due to indexing lag, just rerun the verify command manually after ~30s.
  try {
    console.log("🔎 Verifying on BaseScan…");
    await run("verify:verify", {
      address: addr,
      constructorArguments: [],
      contract: "contracts/OrbatronToken.sol:OrbatronToken",
    });
    console.log("🎉 Verified:", `${explorer(addr)}#code`);
  } catch (e) {
    console.log("⚠️ Verify step skipped/failed (can retry):", e.message || e);
  }
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
