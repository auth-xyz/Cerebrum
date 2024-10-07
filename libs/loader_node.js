import { Collection, Routes } from 'discord.js';
import { watch } from 'chokidar';
import { rest } from './utils.js';

import fs from 'fs'
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadFunctions(client, sortedData) {
  const { node_commands, node_events, node_type, node_guildid } = sortedData;
  const nodesDir = path.join(__dirname, '../nodes');
  const nodeDirs = fs.readdirSync(nodesDir).filter(dir => {
    const dirPath = path.join(nodesDir, dir);
    return fs.statSync(dirPath).isDirectory() && 
      fs.existsSync(path.join(dirPath, 'node_config.json'));
  });

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

  console.log('Bot successfully reloaded with new commands and events.');
}

async function reloadComponents(client, components, type, nodeType, nodeGuildId, nodeDir) {
  if (type === 'command') {
    client.commands = new Collection();
  } else {
    client.removeAllListeners();
  }

  console.log('Components being reloaded:', components);

  const componentPromises = components.map(async (componentPath) => {
    const file = typeof componentPath === 'string' ? componentPath : componentPath.file;

    if (!file) {
      console.error('Component file path is undefined:', componentPath);
      return;
    }

    try {
      const fullPath = path.join(nodeDir, file);
      const importedComponent = await import(fullPath);

      if (!importedComponent.default?.data || typeof importedComponent.default.execute !== 'function') {
        console.warn(`Invalid ${type} structure in ${fullPath}`);
        return;
      }

      await handleComponent(client, importedComponent.default, type, nodeType, nodeGuildId);
      console.log(`Reloaded ${type}: ${importedComponent.default.data.name}`);
    } catch (error) {
      console.error(error);
    }
  });

  await Promise.all(componentPromises);
}

async function handleComponent(client, component, type, nodeType, nodeGuildId) {
  if (type === 'command') {
    client.commands.set(component.data.name, component);
    await registerCommand(client, component.data, nodeType, nodeGuildId);
  } else {
    const eventName = component.data.name;
    const execute = (...args) => component.execute(...args);
    component.once ? client.once(eventName, execute) : client.on(eventName, execute);
  }
}

async function registerCommand(client, commandData, nodeType, nodeGuildId) {
  const registerGlobalCommand = async () => {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID))
    console.log(`Registered global command: ${commandData.name}`);
  };

  switch (nodeType) {
    case 'hybrid':
      if (nodeGuildId) {
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, nodeGuildId), { body: [commandData] });
        console.log(`Registered server-specific command: ${commandData.name}`);
      }
      await registerGlobalCommand();
      break;

    case 'server':
      if (nodeGuildId) {
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, nodeGuildId), { body: [commandData] });
        console.log(`Registered server-specific command: ${commandData.name}`);
      }
      break;

    case 'internal':
      await registerGlobalCommand();
      break;

    default:
      console.warn(`Unknown node type for command registration: ${nodeType}`);
  }
}

export function watchForChanges(client, sortedData) {
  const { commands, events } = sortedData;

  if (commands) {
    console.log('Watching commands:', commands);
    watch(commands).on('change', async (filePath) => {
      console.log(`Command changed: ${filePath}`);
      await reloadComponents(client, commands, 'command');
    });
  }

  if (events) {
    console.log('Watching events:', events);
    watch(events).on('change', async (filePath) => {
      console.log(`Event changed: ${filePath}`);
      await reloadComponents(client, events, 'event');
    });
  }

  console.log('Watching for file changes...');
}

