import fs from 'fs';
import path from 'path';

const logDir = path.resolve('./logs');
const logFilePath = path.join(logDir, 'cerebrum.log');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { mode: 0o700 }); 
}

const logLevels = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

function writeLog(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;

    fs.appendFile(logFilePath, logMessage, { encoding: 'utf8', mode: 0o600 }, (err) => {
        if (err) console.error('Failed to write log:', err);
    });
}

const logger = {
    log: (message, level = logLevels.INFO) => writeLog(level, message),
    error: (message) => writeLog(logLevels.ERROR, message),
    warn: (message) => writeLog(logLevels.WARN, message),
    info: (message) => writeLog(logLevels.INFO, message),
    debug: (message) => writeLog(logLevels.DEBUG, message),

    setLogLevel: (level) => {
        if (!Object.values(logLevels).includes(level)) {
            throw new Error(`Invalid log level: ${level}`);
        }
        logger.currentLevel = level;
    },

    currentLevel: logLevels.INFO,
};

export { logger, logLevels };

