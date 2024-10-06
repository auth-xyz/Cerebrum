export default {
    data: {
        name: 'messageCreate'
    },
    async execute(message) {
        const prefix = '!';
        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const commandName = args.shift().toLowerCase();

        // Check if the command is 'latency'
        if (commandName === 'latency') {
            const command = message.client.commands.get('latency');
            if (command) {
                try {
                    await command.execute(message);
                } catch (error) {
                    console.error('Error executing the latency command:', error);
                    await message.reply('There was an error while executing the command.');
                }
            }
        }
    }
};

