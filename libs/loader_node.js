import { Collection, Routes } from 'discord.js';
import { watch } from 'chokidar';
import { rest } from './utils.js';
import { logger } from './logger_node.js'; 

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadFunctions(client, sortedData) {
  const { node_commands, node_events, node_type, node_guildid } = sortedData;
  const nodesDir = path.join(__dirname, '../nodes');
  
  let nodeDirs;
  try {
    nodeDirs = fs.readdirSync(nodesDir).filter(dir => {
      const dirPath = path.join(nodesDir, dir);
      return fs.statSync(dirPath).isDirectory() && 
        fs.existsSync(path.join(dirPath, 'node_config.json'));
    });
  } catch (error) {
    logger.error(`Error reading node directories: ${error.message}`);
    return;
  }

  if (node_commands.length > 0) {
    for (const nodeDir of nodeDirs) {
      await reloadComponents(client, node_commands, 'command', node_type, node_guildid, path.join(nodesDir, nodeDir));
    }
  }

  if (node_events.length > 0) {
    for (const nodeDir of nodeDirs) {
      await reloadComponents(client, node_events, 'event', node_type, null, path.join(nodesDir, nodeDir));
    }
  }

  logger.info('Bot successfully reloaded with new commands and events.');
}

async function reloadComponents(client, components, type, nodeType, nodeGuildId, nodeDir) {
  if (type === 'command') {
    client.commands = new Collection();
  } else {
    client.removeAllListeners();
  }

  logger.info(`Components being reloaded: ${components}`);

  const componentPromises = components.map(async (componentPath) => {
    const file = typeof componentPath === 'string' ? componentPath : componentPath.file;

    if (!file) {
      logger.warn(`Component file path is undefined: ${componentPath}`);
      return;
    }

    try {
      const fullPath = path.join(nodeDir, file);
      const importedComponent = await import(fullPath);

      if (!importedComponent.default?.data || typeof importedComponent.default.execute !== 'function') {
        logger.warn(`Invalid ${type} structure in ${fullPath}`);
        return;
      }

      await handleComponent(client, importedComponent.default, type, nodeType, nodeGuildId);
      logger.info(`Reloaded ${type}: ${importedComponent.default.data.name}`);
    } catch (error) {
      logger.error(`Error reloading component from ${file}: ${error.message}`);
    }
  });

  await Promise.all(componentPromises);
}

async function handleComponent(client, component, type, nodeType, nodeGuildId) {
  try {
    if (type === 'command') {
      client.commands.set(component.data.name, component);
      await registerCommand(client, component.data, nodeType, nodeGuildId);
    } else {
      const eventName = component.data.name;
      const execute = (...args) => component.execute(...args);
      component.once ? client.once(eventName, execute) : client.on(eventName, execute);
    }
  } catch (error) {
    logger.error(`Error handling component: ${error.message}`);
  }
}

async function registerCommand(client, commandData, nodeType, nodeGuildId) {
  const registerGlobalCommand = async () => {
    try {
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID));
      logger.info(`Registered global command: ${commandData.name}`);
    } catch (error) {
      logger.error(`Error registering global command: ${error.message}`);
    }
  };

  try {
    switch (nodeType) {
      case 'hybrid':
        if (nodeGuildId) {
          await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, nodeGuildId), { body: [commandData] });
          logger.info(`Registered server-specific command: ${commandData.name}`);
        }
        await registerGlobalCommand();
        break;

      case 'server':
        if (nodeGuildId) {
          await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, nodeGuildId), { body: [commandData] });
          logger.info(`Registered server-specific command: ${commandData.name}`);
        }
        break;

      case 'internal':
        await registerGlobalCommand();
        break;

      default:
        logger.warn(`Unknown node type for command registration: ${nodeType}`);
    }
  } catch (error) {
    logger.error(`Error registering command: ${error.message}`);
  }
}

export function watchForChanges(client, sortedData) {
  const { commands, events } = sortedData;

  if (commands) {
    logger.info(`Watching commands: ${commands}`);
    watch(commands).on('change', async (filePath) => {
      logger.info(`Command changed: ${filePath}`);
      try {
        await reloadComponents(client, commands, 'command');
      } catch (error) {
        logger.error(`Error reloading command after change: ${error.message}`);
      }
    });
  }

  if (events) {
    logger.info(`Watching events: ${events}`);
    watch(events).on('change', async (filePath) => {
      logger.info(`Event changed: ${filePath}`);
      try {
        await reloadComponents(client, events, 'event');
      } catch (error) {
        logger.error(`Error reloading event after change: ${error.message}`);
      }
    });
  }

  logger.info('Watching for file changes...');
}

