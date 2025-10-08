import winston from "winston";
import path from "path";
import fs from "fs";

// ensure logs folder exists
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const auditLogger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "license-management" },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "licenseAudit.log"),
    }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

export default auditLogger;
