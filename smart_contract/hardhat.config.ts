import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();

const HOLESKY_RPC = "https://ethereum-holesky-rpc.publicnode.com"; 

const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com"; // RPC Sepolia

const config: HardhatUserConfig = {
  solidity: "0.8.28",
   networks: {
    holesky: {
      url: HOLESKY_RPC,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 17000,
    },
    sepolia: {
      url: SEPOLIA_RPC,
      chainId: 11155111,
      accounts:process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  }
};

export default config;
