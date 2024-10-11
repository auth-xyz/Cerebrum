import fs from 'fs/promises';
import * as yup from 'yup';
import { REST, Routes } from 'discord.js';
import { logger } from './logger_node.js'; 

import 'dotenv/config';

export const rest = new REST().setToken(process.env.DISCORD_TOKEN);

export async function validateConfig(config) {
  const schema = yup.object().shape({
    name: yup.string().required(),
    author: yup.string().required(),
    description: yup.string().required(),
    node_version: yup.string().required(),
    node_guildid: yup.string().required(),
    node_type: yup.string().required(),
    node_commands: yup.array().of(yup.string()),
    node_events: yup.array().of(yup.string()),
  });

  try {
    await schema.validate(config, { abortEarly: false });
    return { valid: true, errors: null };
  } catch (err) {
    logger.error(`Validation failed for config: ${err.errors}`); 
    return { valid: false, errors: err.errors };
  }
}

export async function extractFunctionName(filePath) {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const match = fileContent.match(/(?:export\s+default|module\.exports\s*=\s*)\s*(\w+)/);
        return match ? match[1] : path.basename(filePath);
    } catch (error) {
        logger.error(`Error reading file ${filePath}: ${error.message}`); 
        return path.basename(filePath);
    }
}

export async function mapFunctionsToFiles(files) {
    const result = [];
    for (const file of files) {
        const functionName = await extractFunctionName(file);
        result.push({ functionName, file });
    }
    return result;
}

export function categorizeByType(files) {
    const categorized = { mjs: [], ts: [], js: [] };

    files.forEach(file => {
        const fileType = file.split('.').pop();
        if (categorized[fileType]) {
            categorized[fileType].push(file);
        } else {
            logger.warn(`Unrecognized file type: ${file}`); 
        }
    });

    return categorized;
}

export async function exists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        logger.error(`File does not exist: ${filePath}`); 
        return false;
    }
}

export async function readNodeConfig(configPath) {
    try {
        const data = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        logger.error(`Error reading node config file at ${configPath}: ${error.message}`); 
        throw error;
    }
}

