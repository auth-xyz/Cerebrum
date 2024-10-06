import fs from 'fs/promises';
import path from 'path';
import { watch } from "chokidar";

export const nodesDir = path.join(process.cwd(), 'nodes');

export async function watchNodes() {
    const watcher = watch(nodesDir, { persistent: true, depth: 1 });

    watcher.on('addDir', async (dir) => {
        const configPath = path.join(dir, 'node_config.json');
        if (await exists(configPath)) {
            try {
                const config = await readNodeConfig(configPath);
                console.log(config);
                if (isValidConfig(config)) {
                    console.log('Processing node:', config.name);
                    return { config, dir };
                }
            } catch (err) {
                console.error('Error processing folder:', err.message);
            }
        }
    });
}

export async function readNodeConfig(configPath) {
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
}

async function exists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

function isValidConfig(config) {
    const required = {
        name: 'string',
        author: 'string',
        description: 'string',
        node_version: 'string',
        node_guildid: 'string',
        node_type: 'string',
        node_commands: 'array',
        node_events: 'array'
    };

    return Object.keys(required).every(key => {
        const type = Array.isArray(config[key]) ? 'array' : typeof config[key];
        return type === required[key];
    });
}

