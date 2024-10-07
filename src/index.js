import { Client, GatewayIntentBits } from 'discord.js';
import path from 'path';
import 'dotenv/config';

import { watchNodes } from '../libs/config_node.js';
import { sortConfigNodeData } from '../libs/sorter_node.js'; 
import { loadFunctions, watchForChanges } from '../libs/loader_node.js';

const client = new Client({
  intents: [ 
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

(async () => {
  try {
    const nodeDir = path.join(process.cwd(), 'nodes');
    const nodeData = await watchNodes();

    if (typeof nodeData === "undefined" || !nodeData) {
      console.error('Error loading node data or nodeData is undefined, exiting...');
      return process.exit(1);
    }

    const sortedData = await sortConfigNodeData(nodeDir);
    
    if (!sortedData) {
      console.error('Error fetching sorted data, exiting...');
      return process.exit(1);
    }

    await client.login(process.env.DISCORD_TOKEN);
    await loadFunctions(client, sortedData);

    console.log('Bot is now running and watching for changes...');
  } catch (error) {
    console.error('Error starting bot:', error.message);
  }
})();

