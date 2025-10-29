import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OrbatronModule", (m) => {
  // This must match the contract name in contracts/orbatron.sol
  const orbatron = m.contract("Orbatron");
  return { orbatron };
});
