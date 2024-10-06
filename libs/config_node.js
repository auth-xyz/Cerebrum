import fs from 'fs/promises';
import path from 'path';
import { watch } from 'chokidar';

const nodesDir = path.join(process.cwd(), 'nodes');

export async function watchNodesFolder() {
    const watcher = watch(nodesDir, { persistent: true, depth: 1 });

    watcher.on('addDir', async (newDirPath) => {
        try {
            const configPath = path.join(newDirPath, 'node_config.json');

            if (await fileExists(configPath)) {
                const configData = await readNodeConfig(configPath);
                if (validateConfig(configData)) {
                    console.log('Processing node:', configData.name);
                    await processNode(configData, newDirPath);
                }
            }
        } catch (error) {
            console.error('Error processing folder:', error.message);
        }
    });
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function readNodeConfig(configPath) {
    try {
        const data = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error(`Failed to read or parse node_config.json: ${error.message}`);
    }
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

    // Check if all required fields exist and have correct types
    const isValid = Object.keys(requiredFields).every(field => {
        if (typeof config[field] === requiredFields[field] || (requiredFields[field] === 'array' && Array.isArray(config[field]))) {
            return true;
        } else {
            console.warn(`Invalid field: ${field} should be of type ${requiredFields[field]}`);
            return false;
        }
    });

    if (!isValid) {
        console.warn('Invalid or missing fields in node_config.json');
    }

    return isValid;
}


async function processNode(configData, nodePath) {
    try {
        console.log('Node Name:', configData.name);
        console.log('Author:', configData.author);
        console.log('Description:', configData.description);

        await loadNodeComponents(configData.node_commands, 'commands', nodePath);
        await loadNodeComponents(configData.node_events, 'events', nodePath);
    } catch (error) {
        console.error('Error processing node components:', error.message);
    }
}

async function loadNodeComponents(components, type, nodePath) {
    for (const relativePath of components) {
        const fullPath = path.resolve(nodePath, relativePath);

        if (await fileExists(fullPath)) {
            try {
                const module = await import(fullPath);

                // Validate module structure
                if (typeof module.default?.data === 'object' && typeof module.default?.execute === 'function') {
                    console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} File: ${fullPath}`);
                    console.log('Found "data" and "execute" functions');
                    
                    // Return the execute function for further use
                    console.log(`Execute Function: ${module.default.execute}`);
                } else {
                    console.warn(`Warning: Missing "data" or "execute" in ${fullPath}`);
                }
            } catch (error) {
                console.error(`Error loading ${type} file (${fullPath}): ${error.message}`);
            }
        } else {
            console.warn(`File not found for ${type}: ${fullPath}`);
        }
    }
}

// watchNodesFolder().catch(error => console.error('Failed to watch folder:', error));
