import {  startListenerFactoryEvents, startListenerReselIt } from "./listener/listener";
import logger from "./utils/logger";




const startServer = async () => {
  try {
  
    logger.debug("OKOKOKOKOK")
      startListenerFactoryEvents()
      startListenerReselIt()
      console.log("OKOKO");

  } catch (error) {
    
  }
}
// Lancer le script
startServer()