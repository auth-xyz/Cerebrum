import { watchNodesFolder } from '../libs/config_node.js'; // adjust path accordingly

// Run the watcher
(async () => {
    try {
        await watchNodesFolder();
    } catch (error) {
        console.error('Error starting watcher:', error.message);
    }
})();
