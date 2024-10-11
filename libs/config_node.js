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

      try {
        if (await exists(configPath)) {
          try {
            const config = await readNodeConfig(configPath);

            if (validateConfig(config)) {
              logger.info(`Processing node: ${config.name}`); 
              nodeEmitter.emit('nodeAdded', { config, dir });
            } else {
              logger.warn(`Invalid configuration in ${configPath}`);
            }
          } catch (err) {
            logger.error(`Error reading or validating config from ${configPath}: ${err.message}`); 
          }
        } else {
          logger.warn(`Config file not found in ${dir}`);
        }
      } catch (err) {
        logger.error(`Error checking existence of ${configPath}: ${err.message}`);
      }
    });

    watcher.on('ready', () => {
      logger.info('Watcher ready'); 
      resolve('watcher ready');
    });

    watcher.on('error', (err) => {
      logger.error(`Watcher error: ${err.message}`); 
      reject(`watcher error: ${err.message}`);
    });
  });
};

