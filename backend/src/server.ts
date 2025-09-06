import "dotenv/config"; // ✅ Une seule fois ici
import express from "express";
import { seedUser } from "./seedUser";
import logger from "./utils/logger";
import { startListenerFactoryEvents, startListenerReselIt } from "./listener/listener";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(PORT, async () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  await seedUser();
  startServer()
});


const startServer = async () => {
  try {
  
    logger.debug("OKOKOKOKOK")

      startListenerFactoryEvents()
      startListenerReselIt()
      console.log("OKOKO");

  } catch (error) {
    
  }
}
