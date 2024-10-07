import { Collection } from 'discord.js';
import { watch } from 'chokidar';
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadFunctions(client, sortedData) {
  const { node_commands, node_events, node_type, node_guildid } = sortedData;
  //const nodeDir = path.join(process.cwd(), 'nodes');
  const nodeDir = path.join(__dirname, '../nodes/test1');

  if (node_commands.length > 0) {
    await reloadComponents(client, node_commands, 'command', node_type, node_guildid, nodeDir);
  }

  if (node_events.length > 0) {
    await reloadComponents(client, node_events, 'event', node_type, null, nodeDir); 
  }

  console.log("Bot successfully reloaded with new commands and events.");
}

async function reloadComponents(client, components, type, nodeType, nodeGuildId = null, nodeDir) {
  if (type === 'command') {
    client.commands = new Collection();
  } else {
    client.removeAllListeners();
  }

  console.log('Components being reloaded:', components);

  const componentPromises = components.map(async (componentPath) => {
    const file = typeof componentPath === 'string' ? componentPath : componentPath.file;

    console.log('Component path:', file);

    if (!file) {
      console.error('Component file path is undefined:', componentPath);
      return;
    }

    try {
      const fullPath = path.join(nodeDir, file);

      console.log('Full path:', fullPath); 

      const importedComponent = await import(fullPath);

      if (!importedComponent.default?.data || typeof importedComponent.default.execute !== 'function') {
        console.warn(`Invalid ${type} structure in ${fullPath}`);
        return;
      }

      if (type === 'command') {
        client.commands.set(importedComponent.default.data.name, importedComponent.default);
        await registerCommand(client, importedComponent.default.data, nodeType, nodeGuildId);
      } else {
        const eventName = importedComponent.default.data.name;
        if (importedComponent.default.once) {
          client.once(eventName, (...args) => importedComponent.default.execute(...args));
        } else {
          client.on(eventName, (...args) => importedComponent.default.execute(...args));
        }
      }
      if (type === 'event') {
        const eventName = importedComponent.default.data.name;
        if (importedComponent.default.once) {
          client.once(eventName, (...args) => importedComponent.default.execute(...args));
        } else {
          client.on(eventName, (...args) => importedComponent.default.execute(...args));
        }
      }

      console.log(`Reloaded ${type}: ${importedComponent.default.data.name}`);
    } catch (error) {
      console.error(error);
    }
  });

  await Promise.all(componentPromises);
}


async function registerCommand(client, commandData, nodeType, nodeGuildId) {
  switch (nodeType) {
    case 'hybrid':
      if (nodeGuildId) {
        await client.application.commands.set([commandData], nodeGuildId);
        console.log(`Registered server-specific command: ${commandData.name}`);
      }
      await client.application.commands.create(commandData);
      console.log(`Registered global command: ${commandData.name}`);
      break;

    case 'server':
      if (nodeGuildId) {
        await client.application.commands.set([commandData], nodeGuildId);
        console.log(`Registered server-specific command: ${commandData.name}`);
      }
      break;

    case 'internal':
      await client.application.commands.create(commandData);
      console.log(`Registered global command: ${commandData.name}`);
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

  console.log("Watching for file changes...");
}

