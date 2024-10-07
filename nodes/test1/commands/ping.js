import { EmbedBuilder } from 'discord.js';

export default {
    data: {
        name: 'ping',
        description: 'Check the bot\'s latency'
    },
    async execute(message) {
        const latency = message.client.ws.ping;

        const embed = new EmbedBuilder()
            .setTitle('Bot Latency')
            .setColor('#0099ff')
            .setDescription(`🏓 Pong! The latency is **${latency}ms**.`)
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
    }
};

