import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const OrbatronModule = buildModule("OrbatronModule", (m) => {
  const orbatron = m.contract("Orbatron");
  return { orbatron };
});

export default OrbatronModule;
