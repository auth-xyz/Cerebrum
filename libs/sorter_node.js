import { nodesDir } from './config_node.js';
import path from 'path';
import fs from "fs/promises"

import { extractFunctionName, mapFunctionsToFiles, validateConfig, readNodeConfig } from './utils.js';

export async function sortConfigNodeData(nodeDir) {
    try {
        const subDirs = await fs.readdir(nodeDir, { withFileTypes: true });
        const configDir = subDirs.find(dir => dir.isDirectory());

        if (!configDir) {
            throw new Error('No subdirectory found inside nodes folder');
        }

        const configPath = path.join(nodeDir, configDir.name, 'node_config.json');

        try {
            await fs.access(configPath);
        } catch (err) {
            throw new Error(`Config file not found in ${configDir.name}`);
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
            throw new Error('Invalid config data');
        }
    } catch (error) {
        console.error('Error getting sorted data in controller node:', error.message);
        return null;
    }
};
