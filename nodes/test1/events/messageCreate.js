export default {
    data: {
        name: 'messageCreate',
    },
    execute(message) {
        if (message.content === 'ping') {
            message.channel.send('Pong!');
        }
    },
};

