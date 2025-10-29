// scripts/check-network.js
import "dotenv/config";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const TOKEN = "0xBcD4b254039aa5B98d48221F99ac6b0F8147283Cf"; // Pillow

async function main() {
  const net = await provider.getNetwork();
  console.log("chainId:", Number(net.chainId), "name:", net.name);

  const code = await provider.getCode(TOKEN);
  console.log("contract code at TOKEN length:", code.length, code === "0x" ? "(none)" : "(present)");
}
main();

