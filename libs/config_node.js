import fs from 'fs/promises';
import path from 'path';

import { watch } from "chokidar";
import { object, string, number, array } from "yup";
import { EventEmitter } from 'events';

import { readNodeConfig, validateConfig, exists } from './utils.js';

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
            console.log('Processing node:', config.name);
            nodeEmitter.emit('nodeAdded', { config, dir });
          }
        } catch (err) {
          console.error('Error processing folder:', err.message);
        }
      }
    });

    watcher.on('ready', () => resolve('watcher ready'));
    watcher.on('error', (err) => reject('watcher error:', err));
  });
};
