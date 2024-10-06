import { Collection } from 'discord.js';
import { watch } from 'chokidar';

export async function loadFunctions(client, sortedData) {
  const { commands, events, nodeType, nodeGuildId } = sortedData;

  if (commands) {
    await reloadComponents(client, commands, 'command', nodeType, nodeGuildId);
  }

  if (events) {
    await reloadComponents(client, events, 'event', nodeType);
  }

  console.log("Bot successfully reloaded with new commands and events.");
}

async function reloadComponents(client, components, type, nodeType, nodeGuildId = null) {
  if (type === 'command') {
    client.commands = new Collection();
  } else {
    client.removeAllListeners();
  }

  const componentPromises = Object.values(components).flat().map(async (filePath) => {
    delete require.cache[require.resolve(filePath)];
    
    const component = await import(filePath);
    if (!component.default?.data || typeof component.default.execute !== 'function') {
      console.warn(`Invalid ${type} structure in ${filePath}`);
      return;
    }

    const componentData = component.default.data;
    if (type === 'command') {
      client.commands.set(componentData.name, component.default);
      await registerCommand(client, componentData, nodeType, nodeGuildId);
    } else {
      const eventName = componentData.name;
      if (component.default.once) {
        client.once(eventName, (...args) => component.default.execute(...args));
      } else {
        client.on(eventName, (...args) => component.default.execute(...args));
      }
    }
    console.log(`Reloaded ${type}: ${componentData.name}`);
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
    watch(commands).on('change', async (filePath) => {
      console.log(`Command changed: ${filePath}`);
      await reloadComponents(client, commands, 'command');
    });
  }

  if (events) {
    watch(events).on('change', async (filePath) => {
      console.log(`Event changed: ${filePath}`);
      await reloadComponents(client, events, 'event');
    });
  }

  console.log("Watching for file changes...");
}

