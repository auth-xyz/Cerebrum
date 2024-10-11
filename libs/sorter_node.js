import { nodesDir } from './config_node.js';
import path from 'path';
import fs from "fs/promises";
import { logger } from './logger_node.js'; 

import { extractFunctionName, mapFunctionsToFiles, validateConfig, readNodeConfig } from './utils.js';

export async function sortConfigNodeData(nodeDir) {
    try {
        const subDirs = await fs.readdir(nodeDir, { withFileTypes: true });
        const configDir = subDirs.find(dir => dir.isDirectory());

        if (!configDir) {
            logger.error('No subdirectory found inside nodes folder');
            return null;
        }

        const configPath = path.join(nodeDir, configDir.name, 'node_config.json');

        try {
            await fs.access(configPath);
        } catch (err) {
            logger.error(`Config file not found in ${configDir.name}`);
            return null;
        }

        const configData = await readNodeConfig(configPath);

        if (validateConfig(configData)) {
            const { name, author, description, node_commands, node_events, node_type, node_guildid, node_version } = configData;
            return {
                name: name || '',
                author: author || '',
                description: description || '',
                node_version: node_version || '',
                node_guildid: node_guildid || '',
                node_type: node_type || '',
                node_events: node_events || [],
                node_commands: node_commands || []
            };
        } else {
            logger.error('Invalid config data');
            return null;
        }
    } catch (error) {
        logger.error(`Error getting sorted data in controller node: ${error.message}`);
        return null;
    }
};

