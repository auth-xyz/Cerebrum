// cli.js
import fs from 'fs/promises';
import path from 'path';
import { Command } from 'commander';
import { initDB, addNode } from './database_node.js'; // Adjust the path as needed
import { readNodeConfig } from './utils.js'; // Adjust the path as needed

const program = new Command();

program
  .name('node-cli')
  .description('CLI to manage Discord bot nodes')
  .version('1.0.0');

program
  .command('add-node <nodeDir>')
  .description('Add a node from node_config.json to the database')
  .action(async (nodeDir) => {
    try {
      // Initialize the database
      await initDB();

      // Define the path to the node_config.json
      const configPath = path.join(nodeDir, 'node_config.json');
      console.log(configPath)

      // Check if the config file exists
      await fs.access(configPath);

      // Read the node configuration
      const nodeConfig = await readNodeConfig(configPath);
      console.log(nodeConfig)
      // Add the node to the database
      await addNode(nodeDir);

      console.log('Node added to the database successfully!');
    } catch (error) {
      console.error('Error adding node to the database:', error.message);
    }
  });

program.parse(process.argv);

