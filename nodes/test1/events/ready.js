export default {
    data: {
        name: 'ready'
    },
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}! Bot is now ready.`);
    }
};

