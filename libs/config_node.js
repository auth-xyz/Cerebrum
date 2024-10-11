import fs from 'fs/promises';
import path from 'path';

import { watch } from "chokidar";
import { EventEmitter } from 'events';

import { readNodeConfig, validateConfig, exists } from './utils.js';
import { logger } from './logger_node.js'; 

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

          if (validateConfig(config)) {
            logger.info(`Processing node: ${config.name}`); 
            nodeEmitter.emit('nodeAdded', { config, dir });
          }
        } catch (err) {
          logger.error(`Error processing folder: ${err.message}`); 
        }
      }
    });

    watcher.on('ready', () => {
      logger.info('Watcher ready'); 
      resolve('watcher ready');
    });

    watcher.on('error', (err) => {
      logger.error(`Watcher error: ${err}`); 
      reject(`watcher error: ${err}`);
    });
  });
};

