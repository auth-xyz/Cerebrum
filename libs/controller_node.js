import { readNodeConfig, nodesDir } from './config_node.js';
import path from 'path';
import fs from "fs/promises"

async function extractFunctionName(filePath) {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const match = fileContent.match(/(?:export\s+default|module\.exports\s*=\s*)\s*(\w+)/);
        return match ? match[1] : path.basename(filePath);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        return path.basename(filePath);
    }
}

async function mapFunctionsToFiles(files) {
    const result = [];
    for (const file of files) {
        const functionName = await extractFunctionName(file);
        result.push({ functionName, file });
    }
    return result;
}

export async function getSortedData(nodeDir) {
    try {
        // Get a list of subdirectories inside the nodeDir
        const subDirs = await fs.readdir(nodeDir, { withFileTypes: true });

        // Find the first subdirectory that contains node_config.json
        const configDir = subDirs.find(dir => dir.isDirectory());

        if (!configDir) {
            throw new Error('No subdirectory found inside nodes folder');
        }

        const configPath = path.join(nodeDir, configDir.name, 'node_config.json');

        // Check if node_config.json exists
        try {
            await fs.access(configPath);
        } catch (err) {
            throw new Error(`Config file not found in ${configDir.name}`);
        }

        // Read and process node_config.json
        const configData = await readNodeConfig(configPath);

        if (validateConfig(configData)) {
            const { name, author, description, node_commands, node_events, node_type, node_guildid, node_version } = configData;

            // Return the structured data for the loader
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

