import { ethers } from "ethers";
import  logger  from "../utils/logger"
import dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "";
const RESELIT_ADDRESS = process.env.RESELIT_ADDRESS || "";
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || "";

const RESELIT_ABI = [
  "event TicketListed(address eventAddress, uint256 tokenId, uint256 price, address seller)",
  "event TicketBought(address eventAddress, uint256 tokenId, uint256 price, address buyer)"
];

const FACTORY_ABI = [
  "event EventCreated(address eventAddress)"
];


export async function startListenerFactoryEvents() {
 if (!RPC_URL || !FACTORY_ADDRESS) {
    throw new Error("Missing RPC_URL or FACTORY_ADDRESS in .env");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

  logger.info("✅ Listening for EventCreated on Factory:", FACTORY_ADDRESS);

  factoryContract.on("EventCreated", async (eventAddress: string) => {
    console.log(eventAddress);
    
    logger.info("🏗️ New Event created:", {eventAddress});

  });
}


export async function startListenerReselIt() {
  if (!RPC_URL || !RESELIT_ADDRESS) {
    throw new Error("Missing RPC_URL or RESELIT_ADDRESS in .env");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);

  const reselITContract = new ethers.Contract(RESELIT_ADDRESS, RESELIT_ABI, provider);

  logger.info("✅ Listening for events on ReselIT contract:", RESELIT_ADDRESS);

  reselITContract.on("TicketListed", (eventAddress: any, tokenId: any, price: any, seller: any, event: any) => {
    logger.info("📢 Ticket Listed:");
    logger.debug({
      eventAddress,
      tokenId: tokenId.toString(),
      price: ethers.formatEther(price),
      seller,
      txHash: event.transactionHash
    });

    // 👉 Ici tu peux insérer en DB, envoyer une notif, etc.
  });

  // ✅ Event: TicketBought
  reselITContract.on("TicketBought", (eventAddress: any, tokenId: any, price: any, buyer: any, event: any) => {
    logger.info("🎫 Ticket Bought:");
    logger.debug({
      eventAddress,
      tokenId: tokenId.toString(),
      price: ethers.formatEther(price),
      buyer,
      txHash: event.transactionHash
    });

    // 👉 Ici tu peux insérer en DB, envoyer une notif, etc.
  });
}
