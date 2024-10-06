import { Client, GatewayIntentBits } from 'discord.js';
import { watchNodes } from '../libs/config_node.js';
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
    const nodeData = await watchNodes();

    if(typeof(nodeData) == "undefined")
    {
      console.error('Error loading the node data.\nReturned "undefined", exiting...');
      return process.exit(1);
    };

    if(!nodeData) 
    {
      console.error('Failed to recieve "nodeData"\nExiting...');
      return process.exit(1);
    };

    const sortedData = await getSortedData(nodeData.newDirPath);
    if (!sortedData)
    {
      console.error('Failed to read "sortedData"\nExiting...');
      return process.exit(1);
    };
  
    await loadFunctions(client, sortedData);
    watchForChanges(client, sortedData);

    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error('Error starting bot:', error.message);
  }
})();

