import { Client, GatewayIntentBits } from 'discord.js';
import { watchNodesFolder } from '../libs/config_node.js';
import { loadFunctions, watchForChanges } from '../libs/loader_node.js';  
import { getSortedData } from '../libs/controller_node.js';
import path from 'path';

import 'dotenv/config';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

(async () => {
  try {
    const nodeDir = path.join(process.cwd(), 'nodes');
    const nodeData = await watchNodesFolder(nodeDir);

    if (nodeData) {
      const sortedData = await getSortedData(nodeData.newDirPath);
      
      if (sortedData) {
        await loadFunctions(client, sortedData);
        watchForChanges(client, sortedData);  // Optional live reloading
      }
    }

    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error('Error starting bot:', error.message);
  }
})();

