import { readNodeConfig, nodesDir } from './config_node.js';
import path from 'path';

export async function getSortedData(nodeDir) {
    try {
        const configData = await readNodeConfig(path.join(nodeDir, 'node_config.json'));
        
        if (validateConfig(configData)) {
            const { node_commands, node_events, node_type, node_guildid } = configData;

            const commandsByType = categorizeByType(node_commands);
            const eventsByType = categorizeByType(node_events);

            return {
                commands: commandsByType,
                events: eventsByType,
                nodeType: node_type,
                nodeGuildId: node_guildid
            };
        } else {
            throw new Error('Invalid config data');
        }
    } catch (error) {
        console.error('Error getting sorted data in controller node:', error.message);
        return null;
    }
}

function categorizeByType(files) {
    const categorized = { mjs: [], ts: [], js: [] };

    files.forEach(file => {
        const fileType = file.split('.').pop();
        if (categorized[fileType]) {
            categorized[fileType].push(file);
        } else {
            console.warn(`Unrecognized file type: ${file}`);
        }
    });

    return categorized;
}

function validateConfig(config) {
    const requiredFields = {
        name: 'string',
        author: 'string',
        description: 'string',
        node_version: 'string',
        node_guildid: 'string',
        node_type: 'string',
        node_commands: 'array',
        node_events: 'array'
    };

    return Object.keys(requiredFields).every(field => {
        const expectedType = requiredFields[field];
        const actualType = Array.isArray(config[field]) ? 'array' : typeof config[field];
        return actualType === expectedType;
    });
}

