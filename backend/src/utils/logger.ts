import winston from "winston";
import "winston-daily-rotate-file";
import * as path from "path";

// Définition des niveaux et couleurs
const config = {
  levels: {
    error: 0,
    debug: 1,
    warn: 2,
    data: 3,
    info: 4,
    verbose: 5,
    silly: 6,
    custom: 7,
  },
  colors: {
    error: "red",
    debug: "blue",
    warn: "yellow",
    data: "grey",
    info: "green",
    verbose: "cyan",
    silly: "magenta",
    custom: "yellow",
  },
};

winston.addColors(config.colors);

// Format pour la console (avec couleur)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let logMessage = `${timestamp} [${level}] ${message}`;
    if (Object.keys(metadata).length) {
      logMessage += ` | Metadata: ${JSON.stringify(metadata)}`;
    }
    return logMessage;
  })
);

// Format pour les fichiers (sans couleur)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let logMessage = `${timestamp} [${level}] ${message}`;
    if (Object.keys(metadata).length) {
      logMessage += ` | Metadata: ${JSON.stringify(metadata)}`;
    }
    return logMessage;
  })
);
const logDir = path.resolve(process.cwd(), "../../logs");

// Création du logger
const logger = winston.createLogger({
  levels: config.levels,
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
      let logMessage = `${timestamp} [${level}] ${message}`;

      if (Object.keys(metadata).length) {
        logMessage += ` | 📦 Metadata: ${JSON.stringify(metadata, null, 2)}`;
      }

      return logMessage;
    }),
  ),
  transports: [
    new winston.transports.Console(),

    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, "%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "1d",
      level: "info",
    }),
  ],
  level: "custom",
});

export default logger;
