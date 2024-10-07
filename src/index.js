import { Client, GatewayIntentBits } from 'discord.js';
import { watchNodes } from '../libs/config_node.js';
import { loadFunctions, watchForChanges } from '../libs/loader_node.js';
import { getSortedData } from '../libs/controller_node.js'; // Import the controller function
import path from 'path';
import 'dotenv/config';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

(async () => {
  try {
    const nodeDir = path.join(process.cwd(), 'nodes');
    
    // Load node configuration data
    const nodeData = await watchNodes();

    if (typeof nodeData === "undefined" || !nodeData) {
      console.error('Error loading node data or nodeData is undefined, exiting...');
      return process.exit(1);
    }

    // Get sorted data using the controller
    const sortedData = await getSortedData(nodeDir);
    
    if (!sortedData) {
      console.error('Error fetching sorted data, exiting...');
      return process.exit(1);
    }

    // Log into the bot
    await client.login(process.env.DISCORD_TOKEN);
    
    // Load functions (commands and events) into the client
    await loadFunctions(client, sortedData);

    // Watch for file changes (optional)
    watchForChanges(client, sortedData);

    console.log('Bot is now running and watching for changes...');

  } catch (error) {
    console.error('Error starting bot:', error.message);
  }
})();

