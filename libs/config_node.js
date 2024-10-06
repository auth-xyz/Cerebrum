import fs from 'fs/promises';
import path from 'path';

import { watch } from "chokidar";
import { object, string, number, array } from "yup";
import { EventEmitter } from 'events';

export const nodesDir = path.join(process.cwd(), 'nodes');
export const nodeEmitter = new EventEmitter();

export async function watchNodes() {
  return new Promise((resolve, reject) => {
    const watcher = watch(nodesDir, { persistent: true, depth: 1 });

    watcher.on('addDir', async (dir) => {
      const configPath = path.join(dir, 'node_config.json');
      
      if (await exists(configPath)) {
        try {
          const config = await readNodeConfig(configPath);
          console.log(config);
          
          if (isValidConfig(config)) {
            console.log('Processing node:', config.name);
            nodeEmitter.emit('nodeAdded', { config, dir });
          }
        } catch (err) {
          console.error('Error processing folder:', err.message);
        }
      }
    });

    watcher.on('ready', () => resolve('watcher ready'));  // Resolve when watcher is ready
    watcher.on('error', (err) => reject('watcher error:', err));
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
    let required = object({
      name: string().required(),
      author: string().required(),
      description: string(),
      node_version: string().required(),
      node_guildid: number().positive().integer(),
      node_type: string().required(),
      node_commands: array().required(),
      node_events: array().required()
    })
    
    return Object.keys(required).every(key => {
        const type = Array.isArray(config[key]) ? 'array' : typeof config[key];
        return type === required[key];
    });
}

