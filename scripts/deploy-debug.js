import "dotenv/config";
import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const [signer] = await ethers.getSigners();
  const addr = await signer.getAddress();
  const net = await ethers.provider.getNetwork();
  console.log("Network chainId:", Number(net.chainId)); // must be 8453
  console.log("Deployer:", addr);
  console.log("Deployer nonce (before):", await ethers.provider.getTransactionCount(addr));

  // Build factory
  const PillowToken = await ethers.getContractFactory("PillowToken");

  // Optional: give plenty of gas
  const gasPrice = await ethers.provider.getFeeData();
  console.log("Fee data:", {
    maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
    maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString(),
  });

  console.log("\nSending deployment tx…");
  const contract = await PillowToken.deploy({ gasLimit: 5_000_000 }); // big cap, Base will refund unused
  const deployTx = contract.deploymentTransaction();
  console.log("Deploy tx hash:", deployTx?.hash);

  // Wait for mining
  const receipt = await deployTx.wait(); // ethers v6
  console.log("\nReceipt status:", receipt?.status);           // 1 = success, 0 = revert
  console.log("Block:", receipt?.blockNumber);
  console.log("ContractAddress (from receipt):", receipt?.contractAddress);

  // Wait forDeployment too (redundant but safe)
  await contract.waitForDeployment();
  const contractAddr = await contract.getAddress();
  console.log("getAddress():", contractAddr);

  // Confirm bytecode exists
  const code = await ethers.provider.getCode(contractAddr);
  console.log("Bytecode present:", code !== "0x", "length:", code.length);

  console.log("\nIf Bytecode present = true, verify with:");
  console.log(`npx hardhat verify --network base --contract contracts/PillowToken.sol:PillowToken ${contractAddr}`);
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
