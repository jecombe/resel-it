import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ReselITModule = buildModule("ReselITModule", (m) => {
  // Pas de paramètres car constructeur vide
  const reselIT = m.contract("ReselIT");

  return { reselIT };
});

export default ReselITModule;
