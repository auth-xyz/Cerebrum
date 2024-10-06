import fs from 'fs/promises';
import path from 'path';
import { watch } from "chokidar"

export const nodesDir = path.join(process.cwd(), 'nodes');

export async function watchNodesFolder() {
    const watcher = watch(nodesDir, { persistent: true, depth: 1 });

    watcher.on('addDir', async (newDirPath) => {
        const configPath = path.join(newDirPath, 'node_config.json');
        try {
            if (await fileExists(configPath)) {
                const configData = await readNodeConfig(configPath);
                if (validateConfig(configData)) {
                    console.log('Processing node:', configData.name);
                    return { configData, newDirPath };
                }
            }
        } catch (error) {
            console.error('Error processing folder:', error.message);
        }
    });
}

export async function readNodeConfig(configPath) {
    try {
        const data = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error(`Failed to read or parse node_config.json: ${error.message}`);
    }
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

export function validateConfig(config) {
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

